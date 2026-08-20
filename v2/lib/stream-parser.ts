import type { GroqChunk } from './types';

const DECODER = new TextDecoder();
const ENCODER = new TextEncoder();

function parseSSELine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const data = trimmed.slice(5).trim();
  if (data === '[DONE]') return null;
  try {
    const parsed: GroqChunk = JSON.parse(data);
    return parsed.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null; // malformed chunk — skip
  }
}

/**
 * Strips Groq's SSE framing and re-emits only the assistant's content
 * deltas as a plain-text ReadableStream, ready to pipe to the client.
 */
export function toTextStream(groqBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = groqBody.getReader();
  let buffer = '';

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      buffer += DECODER.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const delta = parseSSELine(rawLine);
        if (delta) controller.enqueue(ENCODER.encode(delta));
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

/**
 * Same SSE parsing as toTextStream, but buffers the full response into one
 * string instead of forwarding it live. Used before the self-correction loop
 * decides whether to critique/revise — nothing should reach the client until
 * that's settled.
 */
export async function bufferStreamText(groqBody: ReadableStream<Uint8Array>): Promise<string> {
  const reader = groqBody.getReader();
  let buffer = '';
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += DECODER.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const delta = parseSSELine(rawLine);
      if (delta) result += delta;
    }
  }

  return result;
      }
