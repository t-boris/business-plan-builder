/** Format dollar amount as $1.2B / $500M / $120K */
export function formatTam(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

/** Parse price range string like "$575-$800" into [min, max]. Returns null if unparseable. */
export function parsePriceRange(pricing: string): [number, number] | null {
  const matches = pricing.match(/\$?([\d,]+)/g);
  if (!matches || matches.length < 1) return null;
  const nums = matches.map((m) => parseInt(m.replace(/[$,]/g, ''), 10)).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  if (nums.length === 1) return [nums[0], nums[0]];
  return [Math.min(...nums), Math.max(...nums)];
}

/** Convert basic markdown to safe HTML for rendering research results. */
export function renderMarkdown(md: string): string {
  let html = md
    .replace(/\[(\d+)\]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-4 mb-1">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-4 mb-1">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h3 class="font-bold text-base mt-4 mb-1">$1</h3>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  html = html.replace(/((?:<li class="ml-4 list-disc">.*<\/li>\n?)+)/g, '<ul class="my-1">$1</ul>');
  html = html.replace(/((?:<li class="ml-4 list-decimal">.*<\/li>\n?)+)/g, '<ol class="my-1">$1</ol>');

  html = html.replace(/^(\|.+\|)\n\|[\s\-:|]+\|\n((?:\|.+\|\n?)*)/gm, (_match, headerRow: string, bodyRows: string) => {
    const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) => `<th class="px-2 py-1 text-left text-xs font-medium border-b">${c.trim()}</th>`).join('');
    const rows = bodyRows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="px-2 py-1 text-xs border-b border-muted">${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table class="w-full border-collapse my-2 text-sm"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  html = html.replace(/^---+$/gm, '<hr class="my-3 border-muted" />');
  html = html.replace(/\n/g, '<br />');
  html = html.replace(/<br \/>\s*(<(?:h[1-4]|ul|ol|table|hr))/g, '$1');
  html = html.replace(/(<\/(?:h[1-4]|ul|ol|table)>)\s*<br \/>/g, '$1');

  return html;
}
