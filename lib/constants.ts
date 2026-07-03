import type { Mode } from './types';

export const MODEL_ID = 'gpt-oss-120b';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const MAX_TOKENS = 4096;
export const TEMPERATURE = 0.3;
export const REQUEST_TIMEOUT_MS = 30_000;
export const MAX_INPUT_LENGTH = 12_000;
export const MAX_HISTORY_MESSAGES = 12;
export const VALID_MODES: readonly Mode[] = ['WRITE', 'DEBUG', 'REVIEW', 'OPTIMIZE', 'EXPLAIN'];
