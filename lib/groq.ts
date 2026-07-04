import { GROQ_API_URL, MAX_HISTORY_MESSAGES, MAX_TOKENS, MODEL_ID, REQUEST_TIMEOUT_MS, TEMPERATURE } from './constants';
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

export function buildGroqPayload(mode: Mode, input: string, history: ChatMessage[] = []): GroqPayload {
  const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);
  return {
    model: MODEL_ID,
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
  process.env.OPENROUTER_API_KEY
  

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
  'HTTP-Referer': 'https://xye-ai.vercel.app',
  'X-Title': 'Xye AI',
},
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') throw new GroqApiError('Groq request timed out.', 504);
    throw new GroqApiError('Network error while reaching Groq API.', 502);
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    let message = `Groq API returned ${response.status}.`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error?.message) message = errorBody.error.message;
    } catch {}
    throw new GroqApiError(message, response.status, retryAfter ? Number(retryAfter) : undefined);
  }

  if (!response.body) throw new GroqApiError('Groq API returned an empty stream.', 502);
  return response;
}
