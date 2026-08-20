import type { Mode } from './types';

export const MODEL_ID = 'llama-3.3-70b-versatile';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const MAX_TOKENS = 4096;
export const TEMPERATURE = 0.3;
export const REQUEST_TIMEOUT_MS = 30_000;
export const MAX_INPUT_LENGTH = 12_000;
export const MAX_HISTORY_MESSAGES = 12;
export const VALID_MODES: readonly Mode[] = ['WRITE', 'DEBUG', 'REVIEW', 'OPTIMIZE', 'EXPLAIN', 'PROMPT_ENGINEER'];

// Zey Search retrieval integration
export const ZEY_SEARCH_TIMEOUT_MS = 6_000;
export const MAX_DOCS_CONTEXT_ENTRIES = 4;
export const MAX_SNIPPET_CHARS = 500;

// Self-correction loop
export const MAX_CORRECTION_ROUNDS = 2;
export const CRITIQUE_MAX_TOKENS = 512;
