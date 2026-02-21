import { Text, Link } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { parseMarkdown, hasMarkdown } from '@/lib/parse-markdown';

/**
 * Renders inline markdown as react-pdf <Text> elements.
 *
 * @param text    - Raw markdown string
 * @param style   - Style applied to the wrapping <Text> (or each segment when `inline`)
 * @param inline  - If true, renders segments without a wrapping <Text>.
 *                  Use when <PdfMd> is nested inside another <Text>.
 */
export function PdfMd({
  text,
  style,
  inline,
}: {
  text: string;
  style?: Style;
  inline?: boolean;
}) {
  if (!text || !hasMarkdown(text)) {
    if (inline) return <Text style={style}>{text}</Text>;
    return <Text style={style}>{text}</Text>;
  }

  const segments = parseMarkdown(text);

  const children = segments.map((seg, i) => {
    switch (seg.type) {
      case 'text':
        return <Text key={i}>{seg.value}</Text>;
      case 'bold':
        return <Text key={i} style={{ fontFamily: 'Helvetica-Bold' }}>{seg.value}</Text>;
      case 'italic':
        return <Text key={i} style={{ fontFamily: 'Helvetica-Oblique' }}>{seg.value}</Text>;
      case 'boldItalic':
        return <Text key={i} style={{ fontFamily: 'Helvetica-BoldOblique' }}>{seg.value}</Text>;
      case 'link':
        return (
          <Link key={i} src={seg.href} style={{ color: '#2563eb', textDecoration: 'underline' }}>
            {seg.text}
          </Link>
        );
      case 'lineBreak':
        return <Text key={i}>{'\n'}</Text>;
    }
  });

  if (inline) return <>{children}</>;
  return <Text style={style}>{children}</Text>;
}
