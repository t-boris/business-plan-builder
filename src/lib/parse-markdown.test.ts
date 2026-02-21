import { describe, it, expect } from 'vitest';
import { parseMarkdown, hasMarkdown } from './parse-markdown';

describe('parseMarkdown', () => {
  it('returns empty array for empty input', () => {
    expect(parseMarkdown('')).toEqual([]);
  });

  it('returns single text segment for plain text', () => {
    expect(parseMarkdown('hello world')).toEqual([
      { type: 'text', value: 'hello world' },
    ]);
  });

  it('parses **bold**', () => {
    expect(parseMarkdown('some **bold** text')).toEqual([
      { type: 'text', value: 'some ' },
      { type: 'bold', value: 'bold' },
      { type: 'text', value: ' text' },
    ]);
  });

  it('parses *italic*', () => {
    expect(parseMarkdown('some *italic* text')).toEqual([
      { type: 'text', value: 'some ' },
      { type: 'italic', value: 'italic' },
      { type: 'text', value: ' text' },
    ]);
  });

  it('parses ***bold italic***', () => {
    expect(parseMarkdown('some ***bold italic*** text')).toEqual([
      { type: 'text', value: 'some ' },
      { type: 'boldItalic', value: 'bold italic' },
      { type: 'text', value: ' text' },
    ]);
  });

  it('parses links with https', () => {
    expect(parseMarkdown('visit [Google](https://google.com) now')).toEqual([
      { type: 'text', value: 'visit ' },
      { type: 'link', text: 'Google', href: 'https://google.com' },
      { type: 'text', value: ' now' },
    ]);
  });

  it('parses links with http', () => {
    expect(parseMarkdown('[site](http://example.com)')).toEqual([
      { type: 'link', text: 'site', href: 'http://example.com' },
    ]);
  });

  it('rejects javascript: protocol links', () => {
    const input = '[click](javascript:alert(1))';
    expect(parseMarkdown(input)).toEqual([
      { type: 'text', value: input },
    ]);
  });

  it('rejects data: protocol links', () => {
    const input = '[click](data:text/html,<h1>hi</h1>)';
    expect(parseMarkdown(input)).toEqual([
      { type: 'text', value: input },
    ]);
  });

  it('parses line breaks', () => {
    expect(parseMarkdown('line1\nline2')).toEqual([
      { type: 'text', value: 'line1' },
      { type: 'lineBreak' },
      { type: 'text', value: 'line2' },
    ]);
  });

  it('parses mixed inline formatting', () => {
    expect(parseMarkdown('**bold** and *italic* and [link](https://x.com)')).toEqual([
      { type: 'bold', value: 'bold' },
      { type: 'text', value: ' and ' },
      { type: 'italic', value: 'italic' },
      { type: 'text', value: ' and ' },
      { type: 'link', text: 'link', href: 'https://x.com' },
    ]);
  });

  it('preserves unmatched markers as literal text', () => {
    // Single * without closing is just text
    expect(parseMarkdown('price is 5*3')).toEqual([
      { type: 'text', value: 'price is 5*3' },
    ]);
  });

  it('preserves text with underscores (no _ syntax)', () => {
    const input = 'some_path_here and __another__';
    expect(parseMarkdown(input)).toEqual([
      { type: 'text', value: input },
    ]);
  });

  it('handles multiple bold segments', () => {
    expect(parseMarkdown('**a** and **b**')).toEqual([
      { type: 'bold', value: 'a' },
      { type: 'text', value: ' and ' },
      { type: 'bold', value: 'b' },
    ]);
  });

  it('handles text that starts or ends with formatting', () => {
    expect(parseMarkdown('**start** middle *end*')).toEqual([
      { type: 'bold', value: 'start' },
      { type: 'text', value: ' middle ' },
      { type: 'italic', value: 'end' },
    ]);
  });
});

describe('hasMarkdown', () => {
  it('returns false for plain text', () => {
    expect(hasMarkdown('hello world')).toBe(false);
  });

  it('returns true for bold', () => {
    expect(hasMarkdown('**bold**')).toBe(true);
  });

  it('returns true for italic', () => {
    expect(hasMarkdown('*italic*')).toBe(true);
  });

  it('returns true for links', () => {
    expect(hasMarkdown('[text](https://url.com)')).toBe(true);
  });

  it('returns true for line breaks', () => {
    expect(hasMarkdown('line1\nline2')).toBe(true);
  });
});
