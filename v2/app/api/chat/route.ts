import { NextRequest, NextResponse } from 'next/server';
import { buildGroqPayload, callGroq, GroqApiError } from '@/lib/groq';
import { fetchDocsContext } from '../../../lib/zey-search';
import { selfCorrect } from '../../../lib/self-correction';
import { bufferStreamText, toTextStream } from '@/lib/stream-parser';
import { MAX_INPUT_LENGTH, VALID_MODES } from '@/lib/constants';
import type { ChatMessage, ChatRequestBody } from '@/lib/types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  return history.filter((m): m is ChatMessage => {
    if (!m || typeof m !== 'object') return false;
    const candidate = m as Record<string, unknown>;
    return (
      (candidate.role === 'user' || candidate.role === 'assistant') &&
      typeof candidate.content === 'string'
    );
  });
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const { mode, input, enableSearch = true, enableSelfCorrection = true } = body;
  const history = sanitizeHistory(body.history);

  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json(
      { error: `mode must be one of: ${VALID_MODES.join(', ')}` },
      { status: 400 }
    );
  }

  if (!input || typeof input !== 'string' || !input.trim()) {
    return NextResponse.json({ error: 'input is required.' }, { status: 400 });
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `input exceeds ${MAX_INPUT_LENGTH} character limit.` },
      { status: 413 }
    );
  }

  try {
    const docsContext = enableSearch ? await fetchDocsContext(input, mode) : [];
    const payload = buildGroqPayload(mode, input, history, docsContext);
    const groqResponse = await callGroq(payload);

    if (!enableSelfCorrection) {
      // Fast path: stream the draft straight to the client, same as Part 3.
      const textStream = toTextStream(groqResponse.body!);
      return new Response(textStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Content-Type-Options': 'nosniff',
          'X-Docs-Context-Used': String(docsContext.length > 0),
          'X-Self-Correction-Applied': 'false',
        },
      });
    }

    // Self-correction path: buffer the draft, critique + revise as needed,
    // then flush the settled result in one shot — nothing streams live here.
    const draftText = await bufferStreamText(groqResponse.body!);
    const finalText = await selfCorrect(mode, input, history, docsContext, draftText);

    const finalStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(finalText));
        controller.close();
      },
    });

    return new Response(finalStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'X-Docs-Context-Used': String(docsContext.length > 0),
        'X-Self-Correction-Applied': String(finalText !== draftText),
      },
    });
  } catch (err) {
    if (err instanceof GroqApiError) {
      const headers: Record<string, string> = {};
      if (err.retryAfter) headers['Retry-After'] = String(err.retryAfter);

      return NextResponse.json(
        {
          error:
            err.status === 429
              ? 'Rate limit exceeded. Please retry shortly.'
              : err.message,
        },
        { status: err.status, headers }
      );
    }

    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
    }
