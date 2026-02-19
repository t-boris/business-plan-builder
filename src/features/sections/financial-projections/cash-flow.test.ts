import { describe, expect, it } from 'vitest';
import { buildCashProjection, sumMonthlyCosts } from './cash-flow';
import type { MonthlyProjection } from '@/types';

describe('sumMonthlyCosts', () => {
  it('sums all monthly cost buckets', () => {
    expect(
      sumMonthlyCosts({
        marketing: 100,
        labor: 200,
        supplies: 300,
        museum: 400,
        transport: 500,
        fixed: 600,
      }),
    ).toBe(2100);
  });
});

describe('buildCashProjection', () => {
  it('builds running ending cash balances from starting cash and monthly net flow', () => {
    const months: MonthlyProjection[] = [
      {
        month: 'Month 1',
        revenue: 1000,
        costs: {
          marketing: 100,
          labor: 100,
          supplies: 100,
          museum: 0,
          transport: 0,
          fixed: 100,
        },
        profit: 0,
      },
      {
        month: 'Month 2',
        revenue: 400,
        nonOperatingCashFlow: 200,
        costs: {
          marketing: 100,
          labor: 100,
          supplies: 100,
          museum: 100,
          transport: 0,
          fixed: 100,
        },
        profit: 0,
      },
      {
        month: 'Month 3',
        revenue: 200,
        costs: {
          marketing: 100,
          labor: 100,
          supplies: 100,
          museum: 100,
          transport: 0,
          fixed: 100,
        },
        profit: 0,
      },
    ];

    const projection = buildCashProjection(months, 1000);

    expect(projection).toEqual([
      { month: 'Month 1', netCashFlow: 600, endingCash: 1600 },
      { month: 'Month 2', netCashFlow: 100, endingCash: 1700 },
      { month: 'Month 3', netCashFlow: -300, endingCash: 1400 },
    ]);
  });
});
