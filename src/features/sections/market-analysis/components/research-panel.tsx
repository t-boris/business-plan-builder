import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronDown, ExternalLink, CheckCircle2, X } from 'lucide-react';
import { renderMarkdown } from '../lib/format-helpers';
import { parsePopulation, parseIncome, parseDollarValue, extractLabeled } from '../lib/parse-research';
import type { MarketAnalysis } from '@/types';

interface ResearchState {
  status: 'idle' | 'loading' | 'done' | 'error';
  result: { content: string; citations: string[] } | null;
  error: string | null;
}

interface ResearchPanelProps {
  state: ResearchState;
  onDismiss: () => void;
  onApply: (updates: Partial<MarketAnalysis>) => void;
}

export function ResearchPanel({ state, onDismiss, onApply }: ResearchPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [applied, setApplied] = useState(false);

  const researchHtml = useMemo(
    () => (state.result ? renderMarkdown(state.result.content) : ''),
    [state.result],
  );

  function handleApply() {
    if (!state.result) return;
    const text = state.result.content;

    const population = parsePopulation(text);
    const income = parseIncome(text);
    const tamDollars = parseDollarValue(text, 'total addressable market', 'TAM');
    const samDollars = parseDollarValue(text, 'serviceable addressable market', 'SAM');
    const somDollars = parseDollarValue(text, 'serviceable obtainable market', 'SOM');

    const updates: Partial<MarketAnalysis> = {};

    // Convert research dollar values into step-based sizing
    if (tamDollars != null || samDollars != null || somDollars != null) {
      const tamSteps = tamDollars != null && tamDollars > 0
        ? [{ label: 'TAM (from research)', value: tamDollars, type: 'currency' as const }]
        : [{ label: 'Total industry market', value: 0, type: 'currency' as const }];

      const samSteps = samDollars != null && samDollars > 0 && tamDollars != null && tamDollars > 0
        ? [{ label: 'SAM filter (from research)', value: (samDollars / tamDollars) * 100, type: 'percentage' as const }]
        : [{ label: 'Reachable by our channels', value: 100, type: 'percentage' as const }];

      const somSteps = somDollars != null && somDollars > 0 && samDollars != null && samDollars > 0
        ? [{ label: 'SOM capture (from research)', value: (somDollars / samDollars) * 100, type: 'percentage' as const }]
        : [{ label: 'Realistic year 1-2 capture rate', value: 2, type: 'percentage' as const }];

      updates.marketSizing = {
        tam: { approach: 'top-down', steps: tamSteps },
        sam: { steps: samSteps },
        som: { steps: somSteps },
      };
    }

    // Append research area info to narrative instead of targetMarket
    const area = extractLabeled(text, 'area') ?? extractLabeled(text, 'geographic area');
    if (area) {
      updates.marketNarrative = `Location: ${area}`;
    }

    if (population != null || income != null) {
      updates.demographics = {
        population: population ?? 0,
        income: income ?? '',
        metrics: [],
      };
    }

    onApply(updates);
    setApplied(true);
  }

  if (state.status === 'error') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
        <AlertCircle className="size-4 shrink-0" />
        <span className="flex-1">{state.error}</span>
        <Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button>
      </div>
    );
  }

  if (state.status !== 'done' || !state.result) return null;

  return (
    <div className="card-elevated rounded-lg border-green-200 dark:border-green-800">
      <button type="button" className="flex items-center justify-between w-full px-5 py-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold">Market Research Results</span>
        </div>
        <div className="flex items-center gap-1">
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>
            <X className="size-4" />
          </Button>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          <div className="rounded-md bg-muted/50 p-4 text-sm leading-relaxed prose-sm" dangerouslySetInnerHTML={{ __html: researchHtml }} />

          {state.result.citations.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Sources</p>
              <div className="flex flex-wrap gap-2">
                {state.result.citations.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors">
                    <ExternalLink className="size-3" />
                    {new URL(url).hostname.replace('www.', '')}
                  </a>
                ))}
              </div>
            </div>
          )}

          <Button size="sm" onClick={handleApply} variant={applied ? 'secondary' : 'default'}>
            {applied ? (
              <>
                <CheckCircle2 className="size-4" />
                Applied
              </>
            ) : (
              'Apply to Market Analysis'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
