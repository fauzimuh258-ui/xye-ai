export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}

export type ContentSegment = { type: 'code'; content: string; language: string } | { type: 'text'; content: string };

const CODE_BLOCK_REGEX = /```(\w*)\n([\s\S]*?)(?:```|$)/g;

export function splitIntoSegments(raw: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  CODE_BLOCK_REGEX.lastIndex = 0;
  while ((match = CODE_BLOCK_REGEX.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const text = raw.slice(lastIndex, match.index);
      if (text.trim()) segments.push({ type: 'text', content: text });
    }
    segments.push({ type: 'code', content: match[2].trimEnd(), language: match[1] || 'text' });
    lastIndex = CODE_BLOCK_REGEX.lastIndex;
  }
  if (lastIndex < raw.length) {
    const text = raw.slice(lastIndex);
    if (text.trim()) segments.push({ type: 'text', content: text });
  }
  return segments;
}

export function extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
  return splitIntoSegments(text).filter((seg): seg is { type: 'code'; content: string; language: string } => seg.type === 'code').map((seg) => ({ language: seg.language, code: seg.content }));
}
