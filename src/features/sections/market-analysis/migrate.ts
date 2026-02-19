import type { MarketAnalysis, CustomMetric } from '@/types';
import { defaultMarketAnalysis } from './defaults';

/**
 * Detect and migrate legacy MarketAnalysis data (pre-redesign) to the new shape.
 * Detection: if `enabledBlocks` is missing, the data is legacy.
 * Also handles the intermediate shape with flat tamDollars/samDollars/somDollars fields.
 */
export function migrateLegacy(raw: Record<string, unknown>): MarketAnalysis {
  // Already new shape (has step-based tam config)
  if (raw.enabledBlocks && raw.marketSizing && typeof (raw.marketSizing as Record<string, unknown>).tam === 'object') {
    return raw as unknown as MarketAnalysis;
  }

  const defaults = defaultMarketAnalysis;
  const demographics = (raw.demographics ?? {}) as Record<string, unknown>;

  // Build demographics.metrics from old hardcoded fields
  const metrics: CustomMetric[] = [];
  if (demographics.householdsWithKids && Number(demographics.householdsWithKids) > 0) {
    metrics.push({ label: 'Households w/ Kids', value: String(demographics.householdsWithKids), source: 'Migrated' });
  }
  if (demographics.annualTourists && Number(demographics.annualTourists) > 0) {
    metrics.push({ label: 'Annual Tourists', value: String(demographics.annualTourists), source: 'Migrated' });
  }
  if (Array.isArray(demographics.languages) && demographics.languages.length > 0) {
    metrics.push({ label: 'Languages', value: (demographics.languages as string[]).join(', '), source: 'Migrated' });
  }

  // Build market narrative from old fields, including old targetMarket location info
  const narrativeParts: string[] = [];
  if (raw.marketSize) narrativeParts.push(String(raw.marketSize));
  if (raw.targetMarketShare) narrativeParts.push(`Target market share: ${raw.targetMarketShare}`);

  // Migrate old targetMarket data into narrative
  const oldTarget = (raw.targetMarket ?? {}) as Record<string, unknown>;
  if (oldTarget.description) narrativeParts.push(String(oldTarget.description));
  if (oldTarget.location) narrativeParts.push(`Location: ${oldTarget.location}`);
  if (oldTarget.ageRange) narrativeParts.push(`Age range: ${oldTarget.ageRange}`);

  // Migrate old flat dollar values to step-based TAM
  const oldSizing = (raw.marketSizing ?? {}) as Record<string, unknown>;
  const tamDollars = Number(oldSizing.tamDollars ?? raw.tamDollars) || 0;
  const samDollars = Number(oldSizing.samDollars) || 0;
  const somDollars = Number(oldSizing.somDollars) || 0;

  // Convert old flat amounts into single-step calculations
  const tamSteps = tamDollars > 0
    ? [{ label: 'TAM (migrated)', value: tamDollars, type: 'currency' as const }]
    : [...defaults.marketSizing.tam.steps];

  const samSteps = samDollars > 0 && tamDollars > 0
    ? [{ label: 'SAM filter (migrated)', value: (samDollars / tamDollars) * 100, type: 'percentage' as const }]
    : [...defaults.marketSizing.sam.steps];

  const somSteps = somDollars > 0 && samDollars > 0
    ? [{ label: 'SOM capture (migrated)', value: (somDollars / samDollars) * 100, type: 'percentage' as const }]
    : [...defaults.marketSizing.som.steps];

  // Preserve old enabledBlocks minus targetMarket
  const oldBlocks = (raw.enabledBlocks ?? {}) as Record<string, boolean>;

  const migrated: MarketAnalysis = {
    ...defaults,
    enabledBlocks: {
      sizing: oldBlocks.sizing ?? true,
      competitors: oldBlocks.competitors ?? true,
      demographics: oldBlocks.demographics ?? true,
      acquisitionFunnel: oldBlocks.acquisitionFunnel ?? true,
      adoptionModel: oldBlocks.adoptionModel ?? true,
      customMetrics: oldBlocks.customMetrics ?? true,
    },

    marketSizing: {
      tam: { approach: 'top-down', steps: tamSteps },
      sam: { steps: samSteps },
      som: { steps: somSteps },
    },
    marketNarrative: (raw.marketNarrative as string) || narrativeParts.join('\n'),

    competitors: Array.isArray(raw.competitors) ? raw.competitors as MarketAnalysis['competitors'] : [],

    demographics: {
      population: Number(demographics.population) || 0,
      income: String(demographics.income ?? ''),
      metrics,
    },

    acquisitionFunnel: Array.isArray(raw.acquisitionFunnel)
      ? raw.acquisitionFunnel as MarketAnalysis['acquisitionFunnel']
      : [...defaults.acquisitionFunnel],
    adoptionModel: raw.adoptionModel
      ? raw.adoptionModel as MarketAnalysis['adoptionModel']
      : { ...defaults.adoptionModel },
    customMetrics: Array.isArray(raw.customMetrics) ? raw.customMetrics as MarketAnalysis['customMetrics'] : [],
  };

  return migrated;
}
