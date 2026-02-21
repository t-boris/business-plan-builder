import { parseMarkdown, hasMarkdown } from '@/lib/parse-markdown';

/**
 * Renders inline markdown as HTML.
 * Returns a plain string when no markdown is detected (zero extra DOM nodes).
 */
export function Md({ text, className }: { text: string; className?: string }) {
  if (!text || !hasMarkdown(text)) {
    return <>{text}</>;
  }

  const segments = parseMarkdown(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'text':
            return <span key={i}>{seg.value}</span>;
          case 'bold':
            return <strong key={i}>{seg.value}</strong>;
          case 'italic':
            return <em key={i}>{seg.value}</em>;
          case 'boldItalic':
            return <strong key={i}><em>{seg.value}</em></strong>;
          case 'link':
            return (
              <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {seg.text}
              </a>
            );
          case 'lineBreak':
            return <br key={i} />;
        }
      })}
    </span>
  );
}
