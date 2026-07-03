import type { GroqChunk } from './types';

const DECODER = new TextDecoder();
const ENCODER = new TextEncoder();

export function toTextStream(groqBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = groqBody.getReader();
  let buffer = '';

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) { controller.close(); return; }

      buffer += DECODER.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed: GroqChunk = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(ENCODER.encode(delta));
        } catch {}
      }
    },
    cancel() { reader.cancel(); },
  });
}
