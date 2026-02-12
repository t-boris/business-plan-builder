import { useState, useMemo, type KeyboardEvent } from 'react';
import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { useMarketResearch } from '@/hooks/use-market-research';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { isPerplexityAvailable } from '@/lib/ai/perplexity-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import type { MarketAnalysis as MarketAnalysisType, Competitor } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Trash2,
  AlertCircle,
  Search,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Users,
  Baby,
  DollarSign,
  Globe,
  Plane,
  TrendingUp,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

/** Convert basic markdown to safe HTML for rendering research results. */
function renderMarkdown(md: string): string {
  let html = md
    // Strip citation reference brackets like [1], [2][3], etc.
    .replace(/\[(\d+)\]/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers: ###, ##, #
  html = html.replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-4 mb-1">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-4 mb-1">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h3 class="font-bold text-base mt-4 mb-1">$1</h3>');

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered list items: - item or * item
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Ordered list items: 1. item
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Wrap consecutive <li> groups in <ul>/<ol>
  html = html.replace(/((?:<li class="ml-4 list-disc">.*<\/li>\n?)+)/g, '<ul class="my-1">$1</ul>');
  html = html.replace(/((?:<li class="ml-4 list-decimal">.*<\/li>\n?)+)/g, '<ol class="my-1">$1</ol>');

  // Tables: | col | col |
  html = html.replace(/^(\|.+\|)\n\|[\s\-:|]+\|\n((?:\|.+\|\n?)*)/gm, (_match, headerRow: string, bodyRows: string) => {
    const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) => `<th class="px-2 py-1 text-left text-xs font-medium border-b">${c.trim()}</th>`).join('');
    const rows = bodyRows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="px-2 py-1 text-xs border-b border-muted">${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table class="w-full border-collapse my-2 text-sm"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr class="my-3 border-muted" />');

  // Line breaks: convert remaining newlines to <br> but not inside tags
  html = html.replace(/\n/g, '<br />');

  // Clean up excessive <br /> around block elements
  html = html.replace(/<br \/>\s*(<(?:h[1-4]|ul|ol|table|hr))/g, '$1');
  html = html.replace(/(<\/(?:h[1-4]|ul|ol|table)>)\s*<br \/>/g, '$1');

  return html;
}

const defaultMarketAnalysis: MarketAnalysisType = {
  targetDemographic: {
    ageRange: '',
    location: '',
    radius: 0,
    zipCodes: [],
  },
  marketSize: '',
  tamDollars: 0,
  targetMarketShare: '',
  competitors: [],
  demographics: {
    population: 0,
    languages: [],
    income: '',
    householdsWithKids: 0,
    annualTourists: 0,
  },
};

/** Extract a labeled value from text. Searches for "LABEL: value" or "**Label:** value" patterns. */
function extractLabeled(text: string, label: string): string | null {
  // Try exact "LABEL: value" format first
  const exactRe = new RegExp(`(?:^|\\n)\\**${label}\\**:?\\s*(.+)`, 'im');
  const match = text.match(exactRe);
  return match ? match[1].trim().replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim() : null;
}

function parsePopulation(text: string): number | null {
  const raw = extractLabeled(text, 'population') ?? extractLabeled(text, 'total population');
  if (!raw) return null;

  // "~200,000" or "approximately 2.7 million"
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

function parseIncome(text: string): string | null {
  const raw = extractLabeled(text, 'median income') ?? extractLabeled(text, 'median household income');
  if (!raw) {
    // Fallback: look near "income" keyword
    const fallback = text.match(/(?:median|household)\s+income[^$]*?(\$[\d,]+)/i);
    if (fallback) return `Median household ${fallback[1]}`;
    return null;
  }
  const dollarMatch = raw.match(/\$[\d,]+/);
  return dollarMatch ? `Median household ${dollarMatch[0]}` : `Median household ${raw}`;
}

function parseLanguages(text: string): string[] | null {
  const raw = extractLabeled(text, 'languages') ?? extractLabeled(text, 'primary languages');
  if (!raw) return null;

  // Split on commas, keep percentages like "English (70%)"
  const langs = raw
    .split(/,|;/)
    .map((s) => s.replace(/^\s*[-\d.]+\s*/, '').trim())
    .filter((s) => s.length > 1 && s.length < 40);

  return langs.length > 0 ? langs : null;
}

/** Extract percentage from a language string like "English (70.5%)" → 70.5, or null */
function extractLangPercent(lang: string): number | null {
  const m = lang.match(/\((\d+(?:\.\d+)?)\s*%\)/);
  return m ? parseFloat(m[1]) : null;
}

function parseHouseholdsWithKids(text: string): number | null {
  const raw = extractLabeled(text, 'households with children under 12')
    ?? extractLabeled(text, 'households with kids');
  if (!raw) return null;

  const millionMatch = raw.match(/([\d.]+)\s*million/i);
  if (millionMatch) return Math.round(parseFloat(millionMatch[1]) * 1_000_000);

  const thousandMatch = raw.match(/([\d.]+)\s*thousand/i);
  if (thousandMatch) return Math.round(parseFloat(thousandMatch[1]) * 1_000);

  const numMatch = raw.match(/([\d,]+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1].replace(/,/g, ''), 10);
    if (num > 0) return num;
  }

  return null;
}

function parseEstimatedKids(text: string): number | null {
  const raw = extractLabeled(text, 'estimated kids under 12')
    ?? extractLabeled(text, 'kids under 12');
  if (!raw) return null;

  const millionMatch = raw.match(/([\d.]+)\s*million/i);
  if (millionMatch) return Math.round(parseFloat(millionMatch[1]) * 1_000_000);

  const thousandMatch = raw.match(/([\d.]+)\s*thousand/i);
  if (thousandMatch) return Math.round(parseFloat(thousandMatch[1]) * 1_000);

  const numMatch = raw.match(/([\d,]+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1].replace(/,/g, ''), 10);
    if (num > 0) return num;
  }

  return null;
}

function parseAnnualTourists(text: string): number | null {
  const raw = extractLabeled(text, 'annual tourists')
    ?? extractLabeled(text, 'annual visitors');
  if (!raw) return null;

  const millionMatch = raw.match(/([\d.]+)\s*million/i);
  if (millionMatch) return Math.round(parseFloat(millionMatch[1]) * 1_000_000);

  const thousandMatch = raw.match(/([\d.]+)\s*thousand/i);
  if (thousandMatch) return Math.round(parseFloat(thousandMatch[1]) * 1_000);

  const numMatch = raw.match(/([\d,]+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1].replace(/,/g, ''), 10);
    if (num > 0) return num;
  }

  return null;
}

function parseTamDollars(text: string): number | null {
  const raw = extractLabeled(text, 'total addressable market')
    ?? extractLabeled(text, 'TAM');
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

function parseTargetMarketShare(text: string): string | null {
  const raw = extractLabeled(text, 'target market share')
    ?? extractLabeled(text, 'market share');
  if (!raw) return null;
  return raw;
}

/** Parse price range string like "$575-$800" into [min, max]. Returns null if unparseable. */
function parsePriceRange(pricing: string): [number, number] | null {
  const matches = pricing.match(/\$?([\d,]+)/g);
  if (!matches || matches.length < 1) return null;
  const nums = matches.map((m) => parseInt(m.replace(/[$,]/g, ''), 10)).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  if (nums.length === 1) return [nums[0], nums[0]];
  return [Math.min(...nums), Math.max(...nums)];
}

export function MarketAnalysis() {
  const { data, updateData, isLoading } = useSection<MarketAnalysisType>(
    'market-analysis',
    defaultMarketAnalysis
  );
  const aiSuggestion = useAiSuggestion<MarketAnalysisType>('market-analysis');
  const { state: researchState, research, dismiss: dismissResearch } = useMarketResearch();
  const [zipInput, setZipInput] = useState('');
  const [researchExpanded, setResearchExpanded] = useState(true);
  const [applied, setApplied] = useState(false);

  const researchHtml = useMemo(
    () => (researchState.result ? renderMarkdown(researchState.result.content) : ''),
    [researchState.result],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Market Analysis</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested
    ? aiSuggestion.state.suggested
    : data;

  const zipCodes = displayData.targetDemographic.zipCodes ?? [];

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) {
      updateData(() => suggested);
    }
  }

  function updateDemographic(field: keyof MarketAnalysisType['targetDemographic'], value: string | number | string[]) {
    updateData((prev) => ({
      ...prev,
      targetDemographic: { ...prev.targetDemographic, [field]: value },
    }));
  }

  function updateDemographics(field: keyof MarketAnalysisType['demographics'], value: number | string | string[]) {
    updateData((prev) => ({
      ...prev,
      demographics: { ...prev.demographics, [field]: value },
    }));
  }

  function updateCompetitor(index: number, field: keyof Competitor, value: string) {
    updateData((prev) => {
      const competitors = [...prev.competitors];
      competitors[index] = { ...competitors[index], [field]: value };
      return { ...prev, competitors };
    });
  }

  function addCompetitor() {
    updateData((prev) => ({
      ...prev,
      competitors: [
        ...prev.competitors,
        { name: '', pricing: '', strengths: '', weaknesses: '' },
      ],
    }));
  }

  function removeCompetitor(index: number) {
    updateData((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index),
    }));
  }

  function addZipCode(zip: string) {
    const cleaned = zip.trim().replace(/\D/g, '');
    if (cleaned.length === 5 && !zipCodes.includes(cleaned)) {
      updateDemographic('zipCodes', [...zipCodes, cleaned]);
    }
    setZipInput('');
  }

  function removeZipCode(zip: string) {
    updateDemographic('zipCodes', zipCodes.filter((z) => z !== zip));
  }

  function handleZipKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addZipCode(zipInput);
    }
    if (e.key === 'Backspace' && zipInput === '' && zipCodes.length > 0) {
      removeZipCode(zipCodes[zipCodes.length - 1]);
    }
  }

  function handleResearch() {
    setApplied(false);
    research(
      zipCodes,
      '',
    );
  }

  function handleApplyResearch() {
    if (!researchState.result) return;
    const text = researchState.result.content;

    const population = parsePopulation(text);
    const income = parseIncome(text);
    const languages = parseLanguages(text);
    const householdsWithKids = parseHouseholdsWithKids(text);
    const estimatedKids = parseEstimatedKids(text);
    const annualTourists = parseAnnualTourists(text);
    const tamDollars = parseTamDollars(text);
    const targetMarketShare = parseTargetMarketShare(text);
    const area = extractLabeled(text, 'area') ?? extractLabeled(text, 'geographic area');
    const marketSizeRaw = extractLabeled(text, 'market size');

    // Build a market size summary from the research data
    const marketSizeParts: string[] = [];
    if (area) marketSizeParts.push(area);
    if (population) marketSizeParts.push(`${population.toLocaleString()} population`);
    if (householdsWithKids) marketSizeParts.push(`~${householdsWithKids.toLocaleString()} households with children under 12`);
    if (estimatedKids) marketSizeParts.push(`Estimated ${estimatedKids.toLocaleString()} kids in target demographic`);
    if (marketSizeRaw) marketSizeParts.push(marketSizeRaw);
    const marketSize = marketSizeParts.length > 0
      ? marketSizeParts.join(' — ')
      : null;

    updateData((prev) => ({
      ...prev,
      ...(area ? { targetDemographic: { ...prev.targetDemographic, location: area } } : {}),
      ...(marketSize ? { marketSize } : {}),
      ...(tamDollars != null ? { tamDollars } : {}),
      ...(targetMarketShare != null ? { targetMarketShare } : {}),
      demographics: {
        ...prev.demographics,
        ...(population != null ? { population } : {}),
        ...(income != null ? { income } : {}),
        ...(languages != null ? { languages } : {}),
        ...(householdsWithKids != null ? { householdsWithKids } : {}),
        ...(annualTourists != null ? { annualTourists } : {}),
      },
    }));
    setApplied(true);
  }

  const formatTam = (value: number): string => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const sectionContent = (
    <div className="space-y-6">
      {/* Market Size Cards — TAM & Target Share */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30 p-5 space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-5" />
            <span className="text-sm font-medium">Total Addressable Market</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {displayData.tamDollars > 0 ? formatTam(displayData.tamDollars) : '—'}
          </p>
        </div>

        <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/30 p-5 space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Target className="size-5" />
            <span className="text-sm font-medium">Target Market Share</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {displayData.targetMarketShare || '—'}
          </p>
        </div>
      </div>

      {/* Demographic Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Users className="size-4" />
              <span className="text-xs font-medium text-muted-foreground">Population</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {displayData.demographics.population > 0 ? displayData.demographics.population.toLocaleString() : '—'}
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Baby className="size-4" />
              <span className="text-xs font-medium text-muted-foreground">Households w/ Kids</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {displayData.demographics.householdsWithKids > 0 ? displayData.demographics.householdsWithKids.toLocaleString() : '—'}
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <DollarSign className="size-4" />
              <span className="text-xs font-medium text-muted-foreground">Median Income</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {displayData.demographics.income
                ? (displayData.demographics.income.match(/\$[\d,]+/)?.[0] ?? displayData.demographics.income)
                : '—'}
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Globe className="size-4" />
              <span className="text-xs font-medium text-muted-foreground">Languages</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {displayData.demographics.languages.length}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {displayData.demographics.languages.map((l) => l.replace(/\s*\([\d.]+%\)/, '').trim()).join(', ')}
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Plane className="size-4" />
              <span className="text-xs font-medium text-muted-foreground">Annual Tourists</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {displayData.demographics.annualTourists > 0 ? displayData.demographics.annualTourists.toLocaleString() : '—'}
            </p>
          </div>
        </div>

      {/* Target Demographic + Market Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Target Demographic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Age Range</label>
              <Input
                value={displayData.targetDemographic.ageRange}
                onChange={(e) => updateDemographic('ageRange', e.target.value)}
                readOnly={isPreview}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <Input
                value={displayData.targetDemographic.location}
                onChange={(e) => updateDemographic('location', e.target.value)}
                readOnly={isPreview}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Radius (miles)</label>
              <div className="relative">
                <Input
                  type="number"
                  value={displayData.targetDemographic.radius}
                  onChange={(e) => updateDemographic('radius', Number(e.target.value))}
                  readOnly={isPreview}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">miles</span>
              </div>
            </div>

            {/* Zip Codes + Research */}
            {!isPreview && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Zip Codes</label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 min-h-9 focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:border-ring">
                  {zipCodes.map((zip) => (
                    <span
                      key={zip}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                    >
                      {zip}
                      <button
                        type="button"
                        onClick={() => removeZipCode(zip)}
                        className="rounded-sm hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={zipInput}
                    onChange={(e) => setZipInput(e.target.value)}
                    onKeyDown={handleZipKeyDown}
                    placeholder={zipCodes.length === 0 ? 'Type zip code + Enter' : 'Add more...'}
                    className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    maxLength={5}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResearch}
                    disabled={zipCodes.length === 0 || researchState.status === 'loading' || !isPerplexityAvailable}
                    title={!isPerplexityAvailable ? 'Perplexity API key not configured' : undefined}
                  >
                    {researchState.status === 'loading' ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    {researchState.status === 'loading' ? 'Researching...' : 'Research Market'}
                  </Button>
                  {!isPerplexityAvailable && (
                    <span className="text-xs text-muted-foreground">
                      Add VITE_PERPLEXITY_API_KEY to .env.local
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={displayData.marketSize}
              onChange={(e) => updateData((prev) => ({ ...prev, marketSize: e.target.value }))}
              rows={4}
              readOnly={isPreview}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">TAM ($)</label>
                <Input
                  type="number"
                  value={displayData.tamDollars}
                  onChange={(e) => updateData((prev) => ({ ...prev, tamDollars: Number(e.target.value) }))}
                  placeholder="e.g. 12000000"
                  readOnly={isPreview}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Target Market Share</label>
                <Input
                  value={displayData.targetMarketShare}
                  onChange={(e) => updateData((prev) => ({ ...prev, targetMarketShare: e.target.value }))}
                  placeholder="e.g. 2-5%"
                  readOnly={isPreview}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Results */}
      {researchState.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{researchState.error}</span>
          <Button variant="ghost" size="sm" onClick={dismissResearch}>Dismiss</Button>
        </div>
      )}

      {researchState.status === 'done' && researchState.result && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                <CardTitle className="text-base">Market Research Results</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-xs" onClick={() => setResearchExpanded(!researchExpanded)}>
                  {researchExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={dismissResearch}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {researchExpanded && (
            <CardContent className="space-y-4">
              <div
                className="rounded-md bg-muted/50 p-4 text-sm leading-relaxed prose-sm"
                dangerouslySetInnerHTML={{ __html: researchHtml }}
              />

              {researchState.result.citations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {researchState.result.citations.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <ExternalLink className="size-3" />
                        {new URL(url).hostname.replace('www.', '')}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <Button size="sm" onClick={handleApplyResearch} variant={applied ? 'secondary' : 'default'}>
                {applied ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    Applied
                  </>
                ) : (
                  'Apply to Demographics'
                )}
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      <Separator />

      {/* Competitors Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Competitors</h2>
          {!isPreview && (
            <Button variant="outline" size="sm" onClick={addCompetitor}>
              <Plus className="size-4" />
              Add Competitor
            </Button>
          )}
        </div>

        <Card>
          <CardContent>
            <div className="space-y-3">
              {/* Table Header */}
              <div className="hidden sm:grid grid-cols-[1fr_100px_1fr_1fr_40px] gap-3 items-center">
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <span className="text-xs font-medium text-muted-foreground">Pricing</span>
                <span className="text-xs font-medium text-muted-foreground">Strengths</span>
                <span className="text-xs font-medium text-muted-foreground">Weaknesses</span>
                <span />
              </div>

              {displayData.competitors.map((competitor, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_1fr_1fr_40px] gap-3 items-start border-b pb-3 last:border-0 last:pb-0 sm:border-0 sm:pb-0">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Name</span>
                    <Input
                      value={competitor.name}
                      onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                      placeholder="Competitor name"
                      readOnly={isPreview}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Pricing</span>
                    <Input
                      value={competitor.pricing}
                      onChange={(e) => updateCompetitor(index, 'pricing', e.target.value)}
                      placeholder="$XXX-$XXX"
                      readOnly={isPreview}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Strengths</span>
                    <Input
                      value={competitor.strengths}
                      onChange={(e) => updateCompetitor(index, 'strengths', e.target.value)}
                      placeholder="Key strengths"
                      readOnly={isPreview}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Weaknesses</span>
                    <Input
                      value={competitor.weaknesses}
                      onChange={(e) => updateCompetitor(index, 'weaknesses', e.target.value)}
                      placeholder="Key weaknesses"
                      readOnly={isPreview}
                    />
                  </div>
                  {!isPreview && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="mt-1 sm:mt-0"
                      onClick={() => removeCompetitor(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}

              {displayData.competitors.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No competitors added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Competitor Pricing Chart */}
        {(() => {
          const chartData = displayData.competitors
            .map((c) => {
              const range = parsePriceRange(c.pricing);
              if (!range) return null;
              return { name: c.name, min: range[0], max: range[1] };
            })
            .filter((d): d is { name: string; min: number; max: number } => d !== null);

          if (chartData.length === 0) return null;

          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Competitor Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v: number) => `$${v}`} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Bar dataKey="min" fill="#94a3b8" name="Min Price" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="max" fill="#6366f1" name="Max Price" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      <Separator />

      {/* Demographics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Demographics</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Population</label>
                  <Input
                    type="number"
                    value={displayData.demographics.population}
                    onChange={(e) => updateDemographics('population', Number(e.target.value))}
                    readOnly={isPreview}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Households with Kids under 12</label>
                  <Input
                    type="number"
                    value={displayData.demographics.householdsWithKids}
                    onChange={(e) => updateDemographics('householdsWithKids', Number(e.target.value))}
                    readOnly={isPreview}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Languages (comma-separated)</label>
                  <Input
                    value={displayData.demographics.languages.join(', ')}
                    onChange={(e) =>
                      updateDemographics(
                        'languages',
                        e.target.value.split(',').map((l) => l.trim()).filter(Boolean)
                      )
                    }
                    readOnly={isPreview}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Median Income</label>
                  <Input
                    value={displayData.demographics.income}
                    onChange={(e) => updateDemographics('income', e.target.value)}
                    readOnly={isPreview}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Annual Tourists</label>
                  <Input
                    type="number"
                    value={displayData.demographics.annualTourists}
                    onChange={(e) => updateDemographics('annualTourists', Number(e.target.value))}
                    readOnly={isPreview}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Languages Pie Chart */}
          {displayData.demographics.languages.length > 0 && (
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Languages</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const langs = displayData.demographics.languages;
                  const pieData = langs.map((lang) => {
                    const pct = extractLangPercent(lang);
                    const label = lang.replace(/\s*\([\d.]+%\)/, '').trim();
                    return { name: label, value: pct ?? 1 };
                  });
                  const hasPercents = langs.some((l) => extractLangPercent(l) !== null);

                  return (
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                            label={hasPercents ? ({ value }: { value: number }) => `${value}%` : false}
                          >
                            {pieData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'][i % 6]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, name) => [hasPercents ? `${v}%` : name, hasPercents ? name : 'Language']} />
                          <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            wrapperStyle={{ fontSize: 11 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Market Analysis</h1>
        <AiActionBar
          onGenerate={() => aiSuggestion.generate('generate', data)}
          onImprove={() => aiSuggestion.generate('improve', data)}
          onExpand={() => aiSuggestion.generate('expand', data)}
          isLoading={aiSuggestion.state.status === 'loading'}
          disabled={!isAiAvailable}
        />
      </div>

      {aiSuggestion.state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{aiSuggestion.state.error}</span>
          <Button variant="ghost" size="sm" onClick={aiSuggestion.dismiss}>Dismiss</Button>
        </div>
      )}

      {aiSuggestion.state.status === 'loading' && (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject} isLoading>
          <div />
        </AiSuggestionPreview>
      )}

      {aiSuggestion.state.status === 'preview' ? (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject}>
          {sectionContent}
        </AiSuggestionPreview>
      ) : (
        aiSuggestion.state.status !== 'loading' && sectionContent
      )}
    </div>
  );
}
