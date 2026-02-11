import type { Package, MarketingChannel, KpiTargets, SectionSlug } from '@/types';

// Default packages pre-populated from PROJECT.md business data
export const DEFAULT_PACKAGES: Package[] = [
  {
    name: 'Ocean Starter',
    price: 800,
    duration: '2 hours',
    maxParticipants: 15,
    includes: [
      'Ocean-themed workshop',
      'Basic party supplies',
      'Party host',
      'Setup and cleanup',
    ],
    description:
      'Entry-level ocean-themed birthday party experience with workshop activities for up to 15 kids.',
  },
  {
    name: 'Ocean Explorer',
    price: 980,
    duration: '2.5 hours',
    maxParticipants: 15,
    includes: [
      'Ocean-themed workshop',
      'Jellyfish Museum tour (15 tickets)',
      'Party supplies',
      'Party host',
      'Photographer',
      'Setup and cleanup',
    ],
    description:
      'Mid-tier package combining the ocean workshop with a guided Jellyfish Museum tour and professional photography.',
  },
  {
    name: 'Ocean VIP',
    price: 1200,
    duration: '3 hours',
    maxParticipants: 15,
    includes: [
      'Ocean-themed workshop',
      'Jellyfish Museum VIP tour (15 tickets)',
      'Premium party supplies',
      'Party host',
      'Photographer',
      'Party bus transport',
      'Custom decorations',
      'Setup and cleanup',
    ],
    description:
      'Premium all-inclusive experience with VIP museum access, party bus transportation, and custom decorations.',
  },
];

// Default KPI targets from PROJECT.md business numbers
export const DEFAULT_KPI_TARGETS: KpiTargets = {
  monthlyLeads: 125,
  conversionRate: 0.2,
  avgCheck: 993,
  cacPerLead: 20,
  cacPerBooking: 85,
  monthlyBookings: 25,
};

// Default marketing channels from PROJECT.md marketing stack
export const DEFAULT_MARKETING_CHANNELS: MarketingChannel[] = [
  {
    name: 'meta-ads',
    budget: 1500,
    expectedLeads: 75,
    expectedCAC: 20,
    description:
      'Primary lead generation via Facebook and Instagram ads targeting parents 28-50 in Miami metro.',
    tactics: [
      'Lead generation campaigns',
      'Messages campaigns for direct booking',
      'Retargeting website visitors',
      'Lookalike audiences from past bookings',
    ],
  },
  {
    name: 'google-ads',
    budget: 500,
    expectedLeads: 25,
    expectedCAC: 20,
    description:
      'Hot traffic search ads targeting parents actively searching for kids birthday party services.',
    tactics: [
      'Search campaigns for birthday party keywords',
      'Location targeting Miami metro 15-25 mile radius',
      'Call extensions for direct booking',
    ],
  },
  {
    name: 'organic-social',
    budget: 0,
    expectedLeads: 15,
    expectedCAC: 0,
    description:
      'Organic content on TikTok and Instagram Reels (3-5 posts per week) to build brand awareness.',
    tactics: [
      'Behind-the-scenes party content',
      'Customer testimonial videos',
      'Ocean-themed educational clips',
      'Trending audio and challenges',
    ],
  },
  {
    name: 'partnerships',
    budget: 200,
    expectedLeads: 10,
    expectedCAC: 20,
    description:
      'Partnerships with schools, after-school centers, and the Jellyfish Museum for referral traffic.',
    tactics: [
      'School flyer distribution',
      'After-school center referral program',
      'Jellyfish Museum cross-promotion',
      'Local business co-marketing',
    ],
  },
];

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

// Default scenario input values derived from business data
export const DEFAULT_SCENARIO_VARIABLES = {
  priceStarter: 800,
  priceExplorer: 980,
  priceVIP: 1200,
  monthlyLeads: 125,
  conversionRate: 0.2,
  cacPerLead: 20,
  monthlyAdBudgetMeta: 1500,
  monthlyAdBudgetGoogle: 500,
  crewCount: 3,
  costPerEvent: 150,
} as const;

// Operational constants for derived calculations
export const CREW_HOURLY_RATE = 20; // Average hourly rate across crew roles
export const AVG_HOURS_PER_EVENT = 4; // Average hours per event for crew
