'use client';
import { useState } from 'react';
import { Button } from './Button';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  return <Button variant="ghost" onClick={handleCopy} disabled={!text}>{copied ? 'Copied' : 'Copy'}</Button>;
}
