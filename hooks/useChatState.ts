'use client';
import { useCallback, useState } from 'react';
import { useStreamedCompletion } from './useStreamedCompletion';
import { MAX_HISTORY_MESSAGES } from '@/lib/constants';
import type { ChatMessage, HistoryEntry, Mode } from '@/lib/types';

function toId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function historyToMessages(history: HistoryEntry[]): ChatMessage[] {
  return history.slice(-Math.ceil(MAX_HISTORY_MESSAGES / 2)).flatMap((entry): ChatMessage[] => [
    { role: 'user', content: entry.input },
    { role: 'assistant', content: entry.output },
  ]);
}

export function useChatState() {
  const [mode, setMode] = useState<Mode>('WRITE');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const { output, isStreaming, error, run, stop, reset } = useStreamedCompletion();

  const submit = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const contextMessages = historyToMessages(history);
    const finalOutput = await run(mode, input, contextMessages);
    if (finalOutput) { const entry: HistoryEntry = { id: toId(), mode, input, output: finalOutput, timestamp: Date.now() }; setHistory((prev) => [...prev, entry]); setActiveEntryId(entry.id); setInput(''); }
  }, [input, isStreaming, history, mode, run]);

  const restoreEntry = useCallback((id: string) => { const entry = history.find((h) => h.id === id); if (!entry) return; setMode(entry.mode); setActiveEntryId(entry.id); }, [history]);
  const clearHistory = useCallback(() => { setHistory([]); setActiveEntryId(null); reset(); }, [reset]);

  return { mode, setMode, input, setInput, history, activeEntryId, output, isStreaming, error, submit, stop, restoreEntry, clearHistory };
}
