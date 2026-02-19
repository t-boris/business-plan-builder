import type { MarketAnalysis } from '@/types';

export const TOP_DOWN_TAM_STEPS = [
  { label: 'Total industry market', value: 0, type: 'currency' as const },
  { label: 'Relevant segment', value: 100, type: 'percentage' as const },
  { label: 'Geographic filter', value: 100, type: 'percentage' as const },
];

export const BOTTOM_UP_TAM_STEPS = [
  { label: 'Number of potential customers', value: 0, type: 'count' as const },
  { label: 'Avg revenue per customer/year', value: 0, type: 'currency' as const },
];

export const defaultMarketAnalysis: MarketAnalysis = {
  enabledBlocks: {
    sizing: true,
    competitors: true,
    demographics: true,
    acquisitionFunnel: true,
    adoptionModel: true,
    customMetrics: true,
  },

  marketSizing: {
    tam: {
      approach: 'top-down',
      steps: [...TOP_DOWN_TAM_STEPS],
    },
    sam: {
      steps: [
        { label: 'Reachable by our channels', value: 100, type: 'percentage' },
      ],
    },
    som: {
      steps: [
        { label: 'Realistic year 1-2 capture rate', value: 2, type: 'percentage' },
      ],
    },
  },
  marketNarrative: '',

  competitors: [],

  demographics: {
    population: 0,
    income: '',
    metrics: [],
  },

  acquisitionFunnel: [
    { label: 'Awareness', description: '', volume: 10000, conversionRate: 20 },
    { label: 'Interest', description: '', volume: 2000, conversionRate: 30 },
    { label: 'Evaluation', description: '', volume: 600, conversionRate: 40 },
    { label: 'Trial', description: '', volume: 240, conversionRate: 50 },
    { label: 'Customer', description: '', volume: 120, conversionRate: 100 },
  ],

  adoptionModel: {
    type: 's-curve',
    totalMarket: 10000,
    initialUsers: 50,
    growthRate: 0.3,
    projectionMonths: 24,
  },

  customMetrics: [],
};
