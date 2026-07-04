import type { Mode } from './types';

// lib/constants.ts
export const MODELS = [
  'google/gemma-4-31b-it:free',           // ⚡ Cepat, coding bagus
  'nvidia/nemotron-nano-9b-v2:free',      // ⚡⚡ Sangat cepat
  'qwen/qwen3-next-80b-a3b-instruct:free', // ⚡ Cepat, 80B
];
export const GROQ_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const MAX_TOKENS = 4096;
export const TEMPERATURE = 0.3;
export const REQUEST_TIMEOUT_MS = 30_000;
export const MAX_INPUT_LENGTH = 12_000;
export const MAX_HISTORY_MESSAGES = 12;
export const VALID_MODES: readonly Mode[] = ['WRITE', 'DEBUG', 'REVIEW', 'OPTIMIZE', 'EXPLAIN'];
