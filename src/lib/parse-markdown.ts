export type MdSegment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'boldItalic'; value: string }
  | { type: 'link'; text: string; href: string }
  | { type: 'lineBreak' };

// Matches inline markdown tokens: ***bold italic***, **bold**, *italic*, [text](url), or newlines
const TOKEN_RE =
  /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\n)/g;

/**
 * Parse a string containing basic inline markdown into typed segments.
 *
 * Supported syntax:
 * - `***bold italic***`
 * - `**bold**`
 * - `*italic*`
 * - `[text](https://url)` (only http/https links)
 * - Line breaks (`\n`)
 *
 * Unmatched markers are preserved as literal text.
 * Plain text with no markers returns a single `text` segment.
 */
export function parseMarkdown(input: string): MdSegment[] {
  if (!input) return [];

  const segments: MdSegment[] = [];
  let lastIndex = 0;

  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_RE.exec(input)) !== null) {
    // Push any plain text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: input.slice(lastIndex, match.index) });
    }

    if (match[2] != null) {
      // ***bold italic***
      segments.push({ type: 'boldItalic', value: match[2] });
    } else if (match[3] != null) {
      // **bold**
      segments.push({ type: 'bold', value: match[3] });
    } else if (match[4] != null) {
      // *italic*
      segments.push({ type: 'italic', value: match[4] });
    } else if (match[5] != null && match[6] != null) {
      // [text](url) - only https?:// validated by regex
      segments.push({ type: 'link', text: match[5], href: match[6] });
    } else if (match[0] === '\n') {
      segments.push({ type: 'lineBreak' });
    }

    lastIndex = match.index + match[0].length;
  }

  // Push any remaining text
  if (lastIndex < input.length) {
    segments.push({ type: 'text', value: input.slice(lastIndex) });
  }

  return segments;
}

/** Returns true if the input contains any markdown syntax worth rendering. */
export function hasMarkdown(input: string): boolean {
  TOKEN_RE.lastIndex = 0;
  return TOKEN_RE.test(input);
}
