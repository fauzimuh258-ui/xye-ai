'use client';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      spellCheck={false}
      className={cn('w-full resize-none rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none', className)}
      {...props}
    />
  );
}
