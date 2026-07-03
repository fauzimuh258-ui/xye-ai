import { NextRequest, NextResponse } from 'next/server';
import { buildGroqPayload, callGroq, GroqApiError } from '@/lib/groq';
import { toTextStream } from '@/lib/stream-parser';
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

  const { mode, input } = body;
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
    const payload = buildGroqPayload(mode, input, history);
    const groqResponse = await callGroq(payload);
    const textStream = toTextStream(groqResponse.body!);

    return new Response(textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
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
