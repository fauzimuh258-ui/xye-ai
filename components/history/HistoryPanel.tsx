'use client';
import { cn } from '@/lib/utils';
import type { HistoryEntry } from '@/lib/types';

interface HistoryPanelProps { history: HistoryEntry[]; activeEntryId: string | null; onSelect: (id: string) => void; onClear: () => void; }

export function HistoryPanel({ history, activeEntryId, onSelect, onClear }: HistoryPanelProps) {
  if (history.length === 0) return <p className="text-xs text-zinc-600">No iterations yet.</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">Iterations</span>
        <button type="button" onClick={onClear} className="text-xs text-zinc-600 hover:text-red-400">Clear</button>
      </div>
      <ol className="flex flex-col gap-1">
        {history.map((entry, i) => (
          <li key={entry.id}>
            <button type="button" onClick={() => onSelect(entry.id)} className={cn('w-full truncate rounded-md px-2.5 py-1.5 text-left text-xs transition-colors', entry.id === activeEntryId ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300')}>
              <span className="mr-1.5 text-emerald-500">#{i + 1}</span>
              {entry.input.slice(0, 48)}{entry.input.length > 48 ? '…' : ''}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
