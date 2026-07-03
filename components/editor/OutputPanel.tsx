'use client';
import { splitIntoSegments } from '@/lib/utils';
import { CopyButton } from '@/components/ui/CopyButton';
import { Spinner } from '@/components/ui/Spinner';

interface OutputPanelProps { output: string; isStreaming: boolean; error: string | null; }

export function OutputPanel({ output, isStreaming, error }: OutputPanelProps) {
  if (error) return <div className="rounded-md border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">{error}</div>;
  if (!output && !isStreaming) return <div className="flex h-full items-center justify-center text-sm text-zinc-600">Output will appear here.</div>;
  const segments = splitIntoSegments(output);
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      {segments.map((seg, i) => seg.type === 'code' ? (
        <div key={i} className="overflow-hidden rounded-md border border-zinc-800">
          <div className="flex items-center justify-between bg-zinc-900 px-3 py-1.5">
            <span className="text-xs text-zinc-500">{seg.language}</span>
            <CopyButton text={seg.content} />
          </div>
          <pre className="overflow-x-auto bg-zinc-950 p-3 text-sm"><code className="font-mono text-zinc-100">{seg.content}</code></pre>
        </div>
      ) : (
        <p key={i} className="whitespace-pre-wrap text-sm text-zinc-300">{seg.content.trim()}</p>
      ))}
      {isStreaming && <div className="flex items-center gap-2 text-xs text-zinc-600"><Spinner className="h-3 w-3" /> Streaming...</div>}
    </div>
  );
}
