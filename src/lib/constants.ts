import type { SectionSlug } from '@/types';

// Section URL slugs matching router paths
export const SECTION_SLUGS: SectionSlug[] = [
  'executive-summary',
  'market-analysis',
  'product-service',
  'marketing-strategy',
  'operations',
  'financial-projections',
  'risks-due-diligence',
  'kpis-metrics',
  'launch-plan',
];

// Display labels for each section slug
export const SECTION_LABELS: Record<SectionSlug, string> = {
  'executive-summary': 'Executive Summary',
  'market-analysis': 'Market Analysis',
  'product-service': 'Product & Service',
  'marketing-strategy': 'Marketing Strategy',
  operations: 'Operations',
  'financial-projections': 'Financial Projections',
  'risks-due-diligence': 'Risks & Due Diligence',
  'kpis-metrics': 'KPIs & Metrics',
  'launch-plan': 'Launch Plan',
};

// Default scenario input values (zeroed — populated per-business)
export const DEFAULT_SCENARIO_VARIABLES = {
  priceTier1: 0,
  priceTier2: 0,
  priceTier3: 0,
  monthlyLeads: 0,
  conversionRate: 0,
  cacPerLead: 0,
  monthlyAdBudgetMeta: 0,
  monthlyAdBudgetGoogle: 0,
  staffCount: 0,
  costPerUnit: 0,
} as const;

// Monthly fixed operations costs (placeholder — Phase 7 will make dynamic)
export const MONTHLY_FIXED_COSTS = 0;
