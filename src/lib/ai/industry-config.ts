import type { BusinessType } from '@/types';

export interface IndustryConfig {
  role: string;
  vocabulary: string[];
}

export const INDUSTRY_CONFIGS: Record<BusinessType, IndustryConfig> = {
  saas: {
    role: 'You are a SaaS business strategist specializing in recurring revenue models, churn reduction, and product-led growth.',
    vocabulary: [
      'MRR',
      'ARR',
      'churn',
      'NRR',
      'LTV:CAC',
      'expansion revenue',
      'PLG',
      'seats',
    ],
  },
  restaurant: {
    role: 'You are a restaurant industry consultant specializing in food service operations, location strategy, and hospitality management.',
    vocabulary: [
      'covers',
      'ticket average',
      'food cost %',
      'labor cost %',
      'table turns',
      'RevPASH',
      'prime cost',
    ],
  },
  retail: {
    role: 'You are a retail business advisor specializing in inventory management, foot traffic optimization, and omnichannel strategy.',
    vocabulary: [
      'SKU',
      'sell-through rate',
      'GMROI',
      'shrinkage',
      'planogram',
      'basket size',
      'ATV',
    ],
  },
  service: {
    role: 'You are a service business consultant specializing in capacity planning, client acquisition, and service delivery optimization.',
    vocabulary: [
      'utilization rate',
      'billable hours',
      'client retention',
      'service delivery SLA',
    ],
  },
  event: {
    role: 'You are an event business strategist specializing in seasonal demand management, venue logistics, and experiential marketing.',
    vocabulary: [
      'per-event cost',
      'capacity utilization',
      'seasonal demand curve',
      'booking lead time',
    ],
  },
  manufacturing: {
    role: 'You are a manufacturing consultant specializing in supply chain management, production optimization, and quality control.',
    vocabulary: [
      'BOM',
      'COGS',
      'yield rate',
      'OEE',
      'lead time',
      'WIP',
      'safety stock',
    ],
  },
  custom: {
    role: 'You are a general business plan writer and strategic advisor.',
    vocabulary: [],
  },
};
