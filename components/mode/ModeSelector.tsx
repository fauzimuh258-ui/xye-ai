'use client';
import { cn } from '@/lib/utils';
import type { Mode } from '@/lib/types';

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: 'WRITE', label: 'Write', hint: 'Generate new code' },
  { value: 'DEBUG', label: 'Debug', hint: 'Find and fix errors' },
  { value: 'REVIEW', label: 'Review', hint: 'Audit existing code' },
  { value: 'OPTIMIZE', label: 'Optimize', hint: 'Improve complexity' },
  { value: 'EXPLAIN', label: 'Explain', hint: 'Understand code' },
];

interface ModeSelectorProps { value: Mode; onChange: (mode: Mode) => void; disabled?: boolean; }

export function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
  return (
    <div role="tablist" aria-label="Xye AI mode" className="flex flex-wrap gap-1.5">
      {MODES.map((m) => (
        <button
          key={m.value} role="tab" type="button" aria-selected={value === m.value} disabled={disabled}
          onClick={() => onChange(m.value)} title={m.hint}
          className={cn('rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', value === m.value ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200')}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
