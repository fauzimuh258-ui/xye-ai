export type Mode = 'WRITE' | 'DEBUG' | 'REVIEW' | 'OPTIMIZE' | 'EXPLAIN' | 'PROMPT_ENGINEER';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestBody {
  mode: Mode;
  input: string;
  history?: ChatMessage[];
  enableSearch?: boolean;
  enableSelfCorrection?: boolean;
}

export interface GroqPayload {
  model: string;
  stream: true;
  temperature: number;
  max_tokens: number;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}

export interface GroqChunk {
  id: string;
  choices: Array<{
    delta: { content?: string };
    finish_reason: string | null;
  }>;
}

export interface HistoryEntry {
  id: string;
  mode: Mode;
  input: string;
  output: string;
  timestamp: number;
}

export interface DocsContextEntry {
  source: string;
  snippet: string;
  }
