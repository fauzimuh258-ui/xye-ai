'use client';

import { ModeSelector } from '@/components/mode/ModeSelector';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { OutputPanel } from '@/components/editor/OutputPanel';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { useChatState } from '@/hooks/useChatState';

export default function Home() {
  const {
    mode, setMode, input, setInput, history, activeEntryId,
    output, isStreaming, error, submit, stop, restoreEntry, clearHistory,
  } = useChatState();

  const activeEntry = history.find((h) => h.id === activeEntryId) ?? null;
  const displayOutput = isStreaming || !activeEntry ? output : activeEntry.output;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Xye AI</h1>
          <p className="text-xs text-zinc-500">AI Coding & Debugging Specialist</p>
        </div>
        <ModeSelector value={mode} onChange={setMode} disabled={isStreaming} />
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_1fr]">
        <aside className="order-3 lg:order-1">
          <HistoryPanel history={history} activeEntryId={activeEntryId} onSelect={restoreEntry} onClear={clearHistory} />
        </aside>

        <section className="order-1 flex flex-col gap-2 lg:order-2">
          <h2 className="text-xs font-medium text-zinc-500">Input</h2>
          <CodeEditor mode={mode} value={input} onChange={setInput} onSubmit={submit} isStreaming={isStreaming} onStop={stop} />
        </section>

        <section className="order-2 flex flex-col gap-2 lg:order-3">
          <h2 className="text-xs font-medium text-zinc-500">Output</h2>
          <div className="min-h-[240px] flex-1 rounded-md border border-zinc-800 bg-zinc-900/40 p-3">
            <OutputPanel output={displayOutput} isStreaming={isStreaming} error={error} />
          </div>
        </section>
      </div>
    </main>
  );
    }
