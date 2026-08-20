import { MAX_DOCS_CONTEXT_ENTRIES, MAX_SNIPPET_CHARS, ZEY_SEARCH_TIMEOUT_MS } from './constants';
import type { DocsContextEntry, Mode } from './types';

// ---------- search trigger heuristic ----------
// Lightweight and approximate by design: no extra LLM call, no added latency
// for requests that obviously don't need fresh docs. False negatives (missing
// a case that should search) are cheap — the model just answers from its own
// knowledge, same as before this feature existed.

const RECENCY_KEYWORDS =
  /\b(terbaru|latest|versi (baru|terkini|terbaru)|current version|up[- ]to[- ]date|changelog|breaking change)\b/i;

const IMPORT_PATTERNS: RegExp[] = [
  /import\s+.*?\s+from\s+['"]([^'".\/][^'"]*)['"]/g, // JS/TS: import x from 'pkg'
  /require\(['"]([^'".\/][^'"]*)['"]\)/g,             // Node: require('pkg')
  /from\s+([a-zA-Z_][\w.]*)\s+import/g,               // Python: from pkg import x
  /^\s*import\s+([a-zA-Z_][\w.]*)\b(?!\s+from\s)/gm,  // Python: import pkg (excludes JS "import x from ...")
  /#include\s*<(?:[a-zA-Z_][\w]*\/)?([a-zA-Z_][\w.]*)\.h>/g, // C: #include <lib.h> or <dir/lib.h>
];

// Standard-library names that don't benefit from a "latest docs" lookup —
// skipping these avoids wasted search calls on the majority of DEBUG/REVIEW
// snippets, which usually import nothing external.
const STDLIB_STOPLIST = new Set([
  'stdio', 'stdlib', 'string', 'math', 'ctype', 'stdbool',
  'os', 'sys', 'json', 're', 'time', 'random', 'collections',
  'itertools', 'functools', 'typing', 'datetime', 'pathlib',
  'fs', 'path', 'http', 'https', 'crypto', 'util',
]);

function extractLibraryNames(input: string): string[] {
  const found = new Set<string>();
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of input.matchAll(pattern)) {
      if (!match[1]) continue;
      const topLevel = match[1].split(/[./]/)[0].toLowerCase();
      if (topLevel && !STDLIB_STOPLIST.has(topLevel)) {
        found.add(topLevel);
      }
    }
  }
  return [...found];
}

const SEARCH_WORTHY_MODES: ReadonlySet<Mode> = new Set(['WRITE', 'DEBUG', 'REVIEW']);

export function shouldSearch(input: string, mode: Mode): boolean {
  if (RECENCY_KEYWORDS.test(input)) return true;
  return SEARCH_WORTHY_MODES.has(mode) && extractLibraryNames(input).length > 0;
}

function buildSearchQuery(input: string, mode: Mode): string {
  const libs = extractLibraryNames(input);
  if (libs.length > 0) {
    return `${libs.slice(0, 2).join(' ')} latest API documentation`;
  }
  const firstLine = input.trim().split('\n')[0];
  return firstLine.slice(0, 100);
}

// ---------- Zey Search client ----------

interface ZeySearchResponse {
  answer?: string;
  aiOverview?: string;
  overview?: string;
  sources?: Array<{ title?: string; url?: string; snippet?: string }>;
}

function truncateSnippet(text: string): string {
  return text.length > MAX_SNIPPET_CHARS ? text.slice(0, MAX_SNIPPET_CHARS) + '…' : text;
}

/**
 * Calls Zey Search and maps its response into docs_context entries.
 *
 * NEVER throws — retrieval is an enhancement, not a dependency (see the system
 * prompt's RETRIEVAL CONTEXT PROTOCOL). Any failure — missing config, timeout,
 * network error, non-OK status, malformed JSON — degrades to an empty array so
 * the main chat request proceeds exactly as it would with no docs_context.
 *
 * ASSUMPTION (unconfirmed): Zey Search exposes POST {ZEY_SEARCH_API_URL} with
 * body { query: string }, returning a synthesized summary under `answer` (or
 * `aiOverview`/`overview` — field name unconfirmed, all three are checked) plus
 * a `sources` array of { title, url, snippet }. Adjust the mapping below once
 * Zey Search's actual response shape is confirmed.
 */
export async function fetchDocsContext(input: string, mode: Mode): Promise<DocsContextEntry[]> {
  const apiUrl = process.env.ZEY_SEARCH_API_URL;
  if (!apiUrl) return [];
  if (!shouldSearch(input, mode)) return [];

  const query = buildSearchQuery(input, mode);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ZEY_SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.ZEY_SEARCH_API_KEY
          ? { Authorization: `Bearer ${process.env.ZEY_SEARCH_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    if (!res.ok) return [];

    const data: ZeySearchResponse = await res.json();
    const entries: DocsContextEntry[] = [];

    const synthesized = data.answer ?? data.aiOverview ?? data.overview;
    if (synthesized) {
      entries.push({ source: 'Zey Search AI Overview', snippet: truncateSnippet(synthesized) });
    }
    for (const s of data.sources ?? []) {
      if (s.snippet) {
        entries.push({ source: s.title || s.url || 'unknown source', snippet: truncateSnippet(s.snippet) });
      }
    }

    return entries.slice(0, MAX_DOCS_CONTEXT_ENTRIES);
  } catch {
    return []; // timeout, network error, or malformed JSON — degrade silently
  } finally {
    clearTimeout(timeout);
  }
  }
