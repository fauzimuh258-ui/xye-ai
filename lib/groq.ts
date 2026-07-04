import { GROQ_API_URL, MAX_HISTORY_MESSAGES, MAX_TOKENS, MODELS, REQUEST_TIMEOUT_MS, TEMPERATURE } from './constants';
import { SYSTEM_PROMPT } from './prompts/system-prompt';
import type { ChatMessage, GroqPayload, Mode } from './types';

export class GroqApiError extends Error {
  constructor(message: string, public status: number, public retryAfter?: number) {
    super(message);
    this.name = 'GroqApiError';
  }
}

function buildUserContent(mode: Mode, input: string): string {
  return `[MODE: ${mode}]\n\n${input}`;
}

export function buildGroqPayload(mode: Mode, input: string, history: ChatMessage[] = [], modelIndex: number = 0): GroqPayload {
  const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);
  const model = MODELS[modelIndex] || MODELS[0];
  return {
    model: model,
    stream: true,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...trimmedHistory,
      { role: 'user', content: buildUserContent(mode, input) },
    ],
  };
}

export async function callGroq(payload: GroqPayload): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new GroqApiError('OPENROUTER_API_KEY is not configured on the server.', 500);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let lastError: Error | null = null;

  // Coba semua model di daftar MODELS
  for (let i = 0; i < MODELS.length; i++) {
    try {
      const currentPayload = { ...payload, model: MODELS[i] };
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://xye-ai.vercel.app',
          'X-Title': 'Xye AI',
        },
        body: JSON.stringify(currentPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok && response.body) {
        return response;
      }

      // Kalau gagal, catat error dan coba model berikutnya
      const errorBody = await response.json().catch(() => ({}));
      console.log(`Model ${MODELS[i]} failed, trying next...`);
      lastError = new Error(errorBody?.error?.message || `HTTP ${response.status}`);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new GroqApiError('Request timed out.', 504);
      }
      lastError = err instanceof Error ? err : new Error('Unknown error');
    }
  }

  // Semua model gagal
  throw new GroqApiError(
    lastError?.message || 'All models failed.',
    502
  );
}
