/** Extract a labeled value from text. Searches for "LABEL: value" or "**Label:** value" patterns. */
export function extractLabeled(text: string, label: string): string | null {
  const exactRe = new RegExp(`(?:^|\\n)\\**${label}\\**:?\\s*(.+)`, 'im');
  const match = text.match(exactRe);
  return match ? match[1].trim().replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim() : null;
}

export function parsePopulation(text: string): number | null {
  const raw = extractLabeled(text, 'population') ?? extractLabeled(text, 'total population');
  if (!raw) return null;

  const millionMatch = raw.match(/([\d.]+)\s*million/i);
  if (millionMatch) return Math.round(parseFloat(millionMatch[1]) * 1_000_000);

  const thousandMatch = raw.match(/([\d.]+)\s*thousand/i);
  if (thousandMatch) return Math.round(parseFloat(thousandMatch[1]) * 1_000);

  const numMatch = raw.match(/([\d,]+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1].replace(/,/g, ''), 10);
    if (num > 100) return num;
  }

  return null;
}

export function parseIncome(text: string): string | null {
  const raw = extractLabeled(text, 'median income') ?? extractLabeled(text, 'median household income');
  if (!raw) {
    const fallback = text.match(/(?:median|household)\s+income[^$]*?(\$[\d,]+)/i);
    if (fallback) return `Median household ${fallback[1]}`;
    return null;
  }
  const dollarMatch = raw.match(/\$[\d,]+/);
  return dollarMatch ? `Median household ${dollarMatch[0]}` : `Median household ${raw}`;
}

export function parseDollarValue(text: string, ...labels: string[]): number | null {
  let raw: string | null = null;
  for (const label of labels) {
    raw = extractLabeled(text, label);
    if (raw) break;
  }
  if (!raw) return null;

  const billionMatch = raw.match(/\$?([\d.]+)\s*billion/i);
  if (billionMatch) return Math.round(parseFloat(billionMatch[1]) * 1_000_000_000);

  const millionMatch = raw.match(/\$?([\d.]+)\s*million/i);
  if (millionMatch) return Math.round(parseFloat(millionMatch[1]) * 1_000_000);

  const thousandMatch = raw.match(/\$?([\d.]+)\s*thousand/i);
  if (thousandMatch) return Math.round(parseFloat(thousandMatch[1]) * 1_000);

  const dollarMatch = raw.match(/\$?([\d,]+)/);
  if (dollarMatch) {
    const num = parseInt(dollarMatch[1].replace(/,/g, ''), 10);
    if (num > 0) return num;
  }

  return null;
}

export function parseStringValue(text: string, ...labels: string[]): string | null {
  for (const label of labels) {
    const raw = extractLabeled(text, label);
    if (raw) return raw;
  }
  return null;
}
