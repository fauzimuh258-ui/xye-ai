'use client';
import type { KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { Mode } from '@/lib/types';

const PLACEHOLDER: Record<Mode, string> = {
  WRITE: 'Describe what you want built, e.g. "a debounce hook in TypeScript"...',
  DEBUG: 'Paste the broken code and/or the error message + stack trace...',
  REVIEW: 'Paste the code you want reviewed...',
  OPTIMIZE: 'Paste the code you want to make faster or more memory-efficient...',
  EXPLAIN: 'Paste the code or concept you want explained...',
};

interface CodeEditorProps { mode: Mode; value: string; onChange: (value: string) => void; onSubmit: () => void; isStreaming: boolean; onStop: () => void; }

export function CodeEditor({ mode, value, onChange, onSubmit, isStreaming, onStop }: CodeEditorProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isStreaming) { e.preventDefault(); onSubmit(); }
  }
  return (
    <div className="flex h-full flex-col gap-3">
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} placeholder={PLACEHOLDER[mode]} className="min-h-[240px] flex-1" disabled={isStreaming} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-600">⌘/Ctrl + Enter to run</span>
        {isStreaming ? <Button variant="danger" onClick={onStop}>Stop</Button> : <Button onClick={onSubmit} disabled={!value.trim()}>Run {mode}</Button>}
      </div>
    </div>
  );
}
