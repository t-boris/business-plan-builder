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
