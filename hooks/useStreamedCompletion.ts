'use client';
import { useCallback, useRef, useState } from 'react';
import type { ChatMessage, Mode } from '@/lib/types';

interface UseStreamedCompletionResult { output: string; isStreaming: boolean; error: string | null; run: (mode: Mode, input: string, history: ChatMessage[]) => Promise<string>; stop: () => void; reset: () => void; }

export function useStreamedCompletion(): UseStreamedCompletionResult {
  const [output, setOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => { abortRef.current?.abort(); setIsStreaming(false); }, []);
  const reset = useCallback(() => { setOutput(''); setError(null); }, []);

  const run = useCallback(async (mode: Mode, input: string, history: ChatMessage[]) => {
    setError(null); setOutput(''); setIsStreaming(true);
    const controller = new AbortController(); abortRef.current = controller;
    let accumulated = '';
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, input, history }), signal: controller.signal });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.error ?? `Request failed with status ${res.status}.`); }
      if (!res.body) throw new Error('No response stream received.');
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; accumulated += decoder.decode(value, { stream: true }); setOutput(accumulated); }
    } catch (err) { if (!(err instanceof Error && err.name === 'AbortError')) { setError(err instanceof Error ? err.message : 'Unexpected streaming error.'); } }
    finally { setIsStreaming(false); abortRef.current = null; }
    return accumulated;
  }, []);
  return { output, isStreaming, error, run, stop, reset };
}
