import {
  CRITIQUE_MAX_TOKENS,
  GROQ_API_URL,
  MAX_CORRECTION_ROUNDS,
  MAX_HISTORY_MESSAGES,
  MAX_TOKENS,
  MODEL_ID,
  REQUEST_TIMEOUT_MS,
} from './constants';
import { buildUserContent } from './groq';
import { SYSTEM_PROMPT } from './prompts/system-prompt';
import type { ChatMessage, DocsContextEntry, Mode } from './types';

const SELF_CORRECTION_MODES: ReadonlySet<Mode> = new Set(['WRITE', 'DEBUG', 'OPTIMIZE', 'REVIEW']);

const CRITIC_SYSTEM_PROMPT = `You are a rigorous, adversarial code reviewer. You will be shown a task and a proposed solution to it. Actively try to find problems: syntax errors, edge cases (null/undefined, empty input, boundary values), regressions against anything implied by the task, style inconsistencies, or fabricated APIs/libraries/language features.

If you find one or more genuine issues, list them one per line, each starting with "ISSUE:". Be specific — name the exact problem, not a vague concern.
If the solution is correct and complete, respond with exactly the single word CLEAN and nothing else.
Never rewrite the solution yourself. Never add commentary outside the ISSUE lines or the single word CLEAN.`;

type GroqMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function callGroqNonStreaming(messages: GroqMessage[], maxTokens: number): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured on the server.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL_ID, stream: false, temperature: 0.2, max_tokens: maxTokens, messages }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Groq API returned ${res.status} during self-correction.`);

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq API returned no content during self-correction.');
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

/** Returns null for "no issues" (either an exact CLEAN verdict, or a verdict
 * that couldn't be parsed into ISSUE lines) — fail-safe toward stopping the
 * loop rather than looping on an ambiguous response. */
function parseCritique(content: string): string[] | null {
  const trimmed = content.trim();
  if (trimmed.toUpperCase() === 'CLEAN') return null;

  const issues = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('ISSUE:'));

  return issues.length > 0 ? issues : null;
}

async function critique(taskDescription: string, draft: string): Promise<string[] | null> {
  const content = await callGroqNonStreaming(
    [
      { role: 'system', content: CRITIC_SYSTEM_PROMPT },
      { role: 'user', content: `TASK:\n${taskDescription}\n\nPROPOSED SOLUTION:\n${draft}` },
    ],
    CRITIQUE_MAX_TOKENS
  );
  return parseCritique(content);
}

async function revise(
  history: ChatMessage[],
  taskDescription: string,
  draft: string,
  issues: string[]
): Promise<string> {
  return callGroqNonStreaming(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-MAX_HISTORY_MESSAGES),
      { role: 'user', content: taskDescription },
      { role: 'assistant', content: draft },
      {
        role: 'user',
        content: `A reviewer found these issues with your solution above:\n${issues.join('\n')}\n\nRevise your solution to address every issue. Output only the corrected final response, following the same format as before.`,
      },
    ],
    MAX_TOKENS
  );
}

/**
 * Takes an already-generated draft and runs critique -> revise on it, looping
 * up to MAX_CORRECTION_ROUNDS times or until a critique pass comes back clean.
 *
 * Only WRITE, DEBUG, OPTIMIZE, and REVIEW pass through this, matching where
 * SYSTEM_PROMPT's own SELF-CORRECTION LOOP section says it's mandatory.
 * EXPLAIN and PROMPT_ENGINEER return the draft unchanged — there's no
 * "correct/incorrect code" to adversarially verify in the same sense.
 *
 * Cost: 1 extra call on an already-clean draft; up to 1 + 2 x MAX_CORRECTION_ROUNDS
 * calls total in the worst case (every round finds issues).
 */
export async function selfCorrect(
  mode: Mode,
  input: string,
  history: ChatMessage[],
  docsContext: DocsContextEntry[],
  draft: string
): Promise<string> {
  if (!SELF_CORRECTION_MODES.has(mode)) return draft;

  const taskDescription = buildUserContent(mode, input, docsContext);
  let current = draft;

  for (let round = 0; round < MAX_CORRECTION_ROUNDS; round++) {
    const issues = await critique(taskDescription, current);
    if (!issues) break;
    current = await revise(history, taskDescription, current, issues);
  }

  return current;
}
