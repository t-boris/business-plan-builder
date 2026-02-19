import { describe, it, expect } from 'vitest';
import { computeGrowthTimeline } from './compute';
import type { GrowthComputeInput } from './compute';
import type { Operations, GrowthEvent } from '@/types';

function makeOps(overrides: Partial<Operations> = {}): Operations {
  return {
    workforce: [],
    capacityItems: [],
    variableComponents: [],
    costItems: [],
    equipment: [],
    safetyProtocols: [],
    operationalMetrics: [],
    ...overrides,
  };
}

function makeInput(overrides: Partial<GrowthComputeInput> = {}): GrowthComputeInput {
  return {
    operations: makeOps(),
    baseAvgCheck: 100,
    baseBookings: 50,
    baseMarketingBudget: 1000,
    seasonCoefficients: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    horizonMonths: 12,
    events: [],
    ...overrides,
  };
}

function makeEvent(overrides: Partial<GrowthEvent> & Pick<GrowthEvent, 'delta'>): GrowthEvent {
  return {
    id: crypto.randomUUID(),
    month: 1,
    label: 'Test event',
    enabled: true,
    ...overrides,
  };
}

describe('computeGrowthTimeline', () => {
  it('returns base state for all months with no events', () => {
    const input = makeInput();
    const result = computeGrowthTimeline(input);

    expect(result.months).toHaveLength(12);
    expect(result.projections).toHaveLength(12);

    // Each month should have same revenue: 50 bookings * 100 avgCheck = 5000
    for (const snap of result.months) {
      expect(snap.revenue).toBe(5000);
      expect(snap.bookings).toBe(50);
      expect(snap.avgCheck).toBe(100);
      expect(snap.marketingBudget).toBe(1000);
    }

    expect(result.summary.totalRevenue).toBe(5000 * 12);
  });

  it('applies hire event from month 3', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 3,
          label: 'Hire engineer',
          delta: {
            type: 'hire',
            data: { role: 'Engineer', count: 1, ratePerHour: 50, hoursPerWeek: 40 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Months 1-2: no workforce cost
    expect(result.months[0].workforceCost).toBe(0);
    expect(result.months[1].workforceCost).toBe(0);

    // Month 3+: 50 * 40 * 1 * 4 = 8000/mo
    for (let i = 2; i < 12; i++) {
      expect(result.months[i].workforceCost).toBe(8000);
    }
  });

  it('accumulates multiple hires at different months', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 1,
          label: 'Hire first',
          delta: {
            type: 'hire',
            data: { role: 'Dev', count: 1, ratePerHour: 50, hoursPerWeek: 40 },
          },
        }),
        makeEvent({
          month: 4,
          label: 'Hire second',
          delta: {
            type: 'hire',
            data: { role: 'Designer', count: 1, ratePerHour: 40, hoursPerWeek: 40 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Month 1-3: only first hire: 50*40*1*4 = 8000
    expect(result.months[0].workforceCost).toBe(8000);
    expect(result.months[2].workforceCost).toBe(8000);

    // Month 4+: both hires: 8000 + 40*40*1*4 = 8000 + 6400 = 14400
    expect(result.months[3].workforceCost).toBe(14400);
    expect(result.months[11].workforceCost).toBe(14400);
  });

  it('applies cost-change event', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 2,
          label: 'Add hosting',
          delta: {
            type: 'cost-change',
            data: {
              category: 'Hosting',
              costType: 'fixed',
              rate: 500,
              driverType: 'monthly',
              driverQuantityPerMonth: 1,
            },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    expect(result.months[0].fixedCost).toBe(0);
    expect(result.months[1].fixedCost).toBe(500);
    expect(result.months[11].fixedCost).toBe(500);
  });

  it('applies capacity-change event', () => {
    const input = makeInput({
      operations: makeOps({
        capacityItems: [
          {
            id: 'cap-1',
            name: 'Widget',
            outputUnitLabel: 'units',
            plannedOutputPerMonth: 100,
            maxOutputPerDay: 0,
            maxOutputPerWeek: 0,
            maxOutputPerMonth: 0,
            utilizationRate: 0,
          },
        ],
      }),
      events: [
        makeEvent({
          month: 5,
          label: 'Expand capacity',
          delta: { type: 'capacity-change', data: { outputDelta: 50 } },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    expect(result.months[0].plannedOutput).toBe(100);
    expect(result.months[3].plannedOutput).toBe(100);
    expect(result.months[4].plannedOutput).toBe(150);
    expect(result.months[11].plannedOutput).toBe(150);
  });

  it('applies capacity-change to a specific product by capacityItemId', () => {
    const input = makeInput({
      operations: makeOps({
        capacityItems: [
          {
            id: 'cap-a',
            name: 'Product A',
            outputUnitLabel: 'units',
            plannedOutputPerMonth: 100,
            maxOutputPerDay: 0,
            maxOutputPerWeek: 0,
            maxOutputPerMonth: 0,
            utilizationRate: 0,
          },
          {
            id: 'cap-b',
            name: 'Product B',
            outputUnitLabel: 'units',
            plannedOutputPerMonth: 50,
            maxOutputPerDay: 0,
            maxOutputPerWeek: 0,
            maxOutputPerMonth: 0,
            utilizationRate: 0,
          },
        ],
      }),
      events: [
        makeEvent({
          month: 3,
          label: 'Expand Product A',
          delta: { type: 'capacity-change', data: { capacityItemId: 'cap-a', outputDelta: 30 } },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Before event: total = 100 + 50 = 150
    expect(result.months[0].plannedOutput).toBe(150);
    expect(result.months[1].plannedOutput).toBe(150);

    // After event: Product A = 130, Product B = 50 unchanged → total = 180
    expect(result.months[2].plannedOutput).toBe(180);
    expect(result.months[11].plannedOutput).toBe(180);
  });

  it('applies global capacity-change equally to all items', () => {
    const input = makeInput({
      operations: makeOps({
        capacityItems: [
          {
            id: 'cap-a',
            name: 'Product A',
            outputUnitLabel: 'units',
            plannedOutputPerMonth: 100,
            maxOutputPerDay: 0,
            maxOutputPerWeek: 0,
            maxOutputPerMonth: 0,
            utilizationRate: 0,
          },
          {
            id: 'cap-b',
            name: 'Product B',
            outputUnitLabel: 'units',
            plannedOutputPerMonth: 50,
            maxOutputPerDay: 0,
            maxOutputPerWeek: 0,
            maxOutputPerMonth: 0,
            utilizationRate: 0,
          },
        ],
      }),
      events: [
        makeEvent({
          month: 2,
          label: 'Scale everything',
          delta: { type: 'capacity-change', data: { outputDelta: 20 } },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Before: 100 + 50 = 150
    expect(result.months[0].plannedOutput).toBe(150);

    // After: (100+20) + (50+20) = 190
    expect(result.months[1].plannedOutput).toBe(190);
  });

  it('applies marketing-change event', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 6,
          label: 'Increase budget',
          delta: { type: 'marketing-change', data: { monthlyBudget: 3000 } },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Month 1-5: base marketing 1000
    for (let i = 0; i < 5; i++) {
      expect(result.months[i].marketingBudget).toBe(1000);
    }
    // Month 6+: 3000
    for (let i = 5; i < 12; i++) {
      expect(result.months[i].marketingBudget).toBe(3000);
    }
  });

  it('applies custom event to correct target', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 1,
          label: 'Bonus revenue',
          delta: {
            type: 'custom',
            data: { label: 'Bonus', value: 500, target: 'revenue' },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Base revenue: 50 * 100 = 5000 + 500 custom = 5500
    expect(result.months[0].revenue).toBe(5500);
  });

  it('filters out disabled events', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 1,
          label: 'Disabled hire',
          enabled: false,
          delta: {
            type: 'hire',
            data: { role: 'Ghost', count: 10, ratePerHour: 100, hoursPerWeek: 40 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // No workforce cost since event is disabled
    expect(result.months[0].workforceCost).toBe(0);
  });

  it('applies seasonality correctly', () => {
    const seasonCoeffs = [0.5, 1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const input = makeInput({ seasonCoefficients: seasonCoeffs });

    const result = computeGrowthTimeline(input);

    // Month 1: 50 * 0.5 * 100 = 2500
    expect(result.months[0].revenue).toBe(2500);
    // Month 2: 50 * 1.5 * 100 = 7500
    expect(result.months[1].revenue).toBe(7500);
  });

  it('cycles seasonality for horizon > 12', () => {
    const seasonCoeffs = [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const input = makeInput({
      seasonCoefficients: seasonCoeffs,
      horizonMonths: 14,
    });

    const result = computeGrowthTimeline(input);

    expect(result.months).toHaveLength(14);
    // Month 1: coeff = 2 -> 50 * 2 * 100 = 10000
    expect(result.months[0].revenue).toBe(10000);
    // Month 13 (index 12): cycles to coeff[0] = 2 -> 10000
    expect(result.months[12].revenue).toBe(10000);
    // Month 14 (index 13): cycles to coeff[1] = 1 -> 5000
    expect(result.months[13].revenue).toBe(5000);
  });

  it('computes break-even month correctly', () => {
    // Start with high costs, then reduce
    const input = makeInput({
      baseMarketingBudget: 10000, // costs > revenue initially
      events: [
        makeEvent({
          month: 4,
          label: 'Cut marketing',
          delta: { type: 'marketing-change', data: { monthlyBudget: 1000 } },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Month 1-3: revenue 5000, marketing cost 10000 => profit -5000 each
    // Month 4+: revenue 5000, marketing cost 1000 => profit 4000 each
    // Cumulative: -5000, -10000, -15000, -11000, -7000, -3000, 1000
    // Break-even at month 7
    expect(result.summary.breakEvenMonth).toBe(7);
  });

  it('returns null break-even if never profitable', () => {
    const input = makeInput({
      baseMarketingBudget: 100000,
    });

    const result = computeGrowthTimeline(input);

    expect(result.summary.breakEvenMonth).toBeNull();
  });

  it('generates projections matching MonthlyProjection format', () => {
    const input = makeInput();
    const result = computeGrowthTimeline(input);

    const proj = result.projections[0];
    expect(proj.month).toBe('Month 1');
    expect(typeof proj.revenue).toBe('number');
    expect(typeof proj.profit).toBe('number');
    expect(proj.costs).toHaveProperty('marketing');
    expect(proj.costs).toHaveProperty('labor');
    expect(proj.costs).toHaveProperty('supplies');
    expect(proj.costs).toHaveProperty('museum');
    expect(proj.costs).toHaveProperty('transport');
    expect(proj.costs).toHaveProperty('fixed');
    expect(proj.costs.museum).toBe(0);
    expect(proj.costs.transport).toBe(0);
  });

  it('supports custom horizon of 6 months', () => {
    const input = makeInput({ horizonMonths: 6 });
    const result = computeGrowthTimeline(input);

    expect(result.months).toHaveLength(6);
    expect(result.projections).toHaveLength(6);
  });

  it('handles operations with existing workforce as base', () => {
    const input = makeInput({
      operations: makeOps({
        workforce: [
          { role: 'Founder', count: 1, ratePerHour: 0, hoursPerWeek: 40 },
        ],
      }),
      events: [
        makeEvent({
          month: 2,
          label: 'Hire assistant',
          delta: {
            type: 'hire',
            data: { role: 'Assistant', count: 1, ratePerHour: 25, hoursPerWeek: 20 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Month 1: only founder (0 cost)
    expect(result.months[0].workforceCost).toBe(0);
    expect(result.months[0].workforce).toHaveLength(1);

    // Month 2+: founder + assistant: 25 * 20 * 1 * 4 = 2000
    expect(result.months[1].workforceCost).toBe(2000);
    expect(result.months[1].workforce).toHaveLength(2);
  });

  // --- New event types (Phase 21) ---

  it('funding-round adds amount to revenue and legalCosts to fixedCost only in event month', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 3,
          label: 'Seed round',
          delta: {
            type: 'funding-round',
            data: { amount: 100000, legalCosts: 5000, investmentType: 'equity' },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Base revenue = 50 * 100 = 5000
    // Month 3: revenue = 5000 + 100000 = 105000, fixedCost includes +5000
    expect(result.months[2].revenue).toBe(105000);
    expect(result.months[2].fixedCost).toBe(5000);

    // Month 4: no one-time additions
    expect(result.months[3].revenue).toBe(5000);
    expect(result.months[3].fixedCost).toBe(0);

    // Month 2: no effect
    expect(result.months[1].revenue).toBe(5000);
    expect(result.months[1].fixedCost).toBe(0);
  });

  it('facility-build spreads construction cost during build and adds rent+capacity after', () => {
    const input = makeInput({
      operations: makeOps({
        capacityItems: [
          {
            id: 'cap-1',
            name: 'Main',
            outputUnitLabel: 'units',
            plannedOutputPerMonth: 100,
            maxOutputPerDay: 0,
            maxOutputPerWeek: 0,
            maxOutputPerMonth: 0,
            utilizationRate: 0,
          },
        ],
      }),
      events: [
        makeEvent({
          month: 2,
          label: 'New facility',
          durationMonths: 3,
          delta: {
            type: 'facility-build',
            data: { constructionCost: 90000, monthlyRent: 3000, capacityAdded: 50 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Month 1: no effect
    expect(result.months[0].fixedCost).toBe(0);
    expect(result.months[0].plannedOutput).toBe(100);

    // Months 2-4 (during build): fixedCost includes 90000/3 = 30000 per month
    expect(result.months[1].fixedCost).toBe(30000);
    expect(result.months[2].fixedCost).toBe(30000);
    expect(result.months[3].fixedCost).toBe(30000);

    // Month 5+ (after completion): fixedCost = 3000 (rent), plannedOutput += 50
    expect(result.months[4].fixedCost).toBe(3000);
    expect(result.months[4].plannedOutput).toBe(150);
    expect(result.months[11].fixedCost).toBe(3000);
    expect(result.months[11].plannedOutput).toBe(150);

    // During build: no capacity change
    expect(result.months[1].plannedOutput).toBe(100);
    expect(result.months[3].plannedOutput).toBe(100);
  });

  it('hiring-campaign staggers hires over duration months', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 1,
          label: 'Dev team',
          durationMonths: 4,
          delta: {
            type: 'hiring-campaign',
            data: {
              totalHires: 4,
              role: 'dev',
              ratePerHour: 50,
              hoursPerWeek: 40,
              recruitingCostPerHire: 2000,
            },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Each month should add ~1 hire (4 hires / 4 months)
    // Month 1: floor(4 * 1/4) = 1 hire, workforceCost = 1 * 50 * 40 * 4 = 8000
    expect(result.months[0].workforceCost).toBe(8000);
    // Month 2: floor(4 * 2/4) = 2 hires, workforceCost = 2 * 50 * 40 * 4 = 16000
    expect(result.months[1].workforceCost).toBe(16000);
    // Month 3: floor(4 * 3/4) = 3 hires
    expect(result.months[2].workforceCost).toBe(24000);
    // Month 4: floor(4 * 4/4) = 4 hires
    expect(result.months[3].workforceCost).toBe(32000);

    // After month 4: all 4 hires ongoing, no recruiting costs
    expect(result.months[4].workforceCost).toBe(32000);
    expect(result.months[11].workforceCost).toBe(32000);

    // Recruiting cost: 1 new hire per month during campaign = 2000 one-time each month
    // fixedCost includes recruiting cost as one-time
    expect(result.months[0].fixedCost).toBe(2000); // 1 new hire
    expect(result.months[1].fixedCost).toBe(2000); // 1 new hire
    expect(result.months[2].fixedCost).toBe(2000); // 1 new hire
    expect(result.months[3].fixedCost).toBe(2000); // 1 new hire

    // After campaign: no more recruiting costs
    expect(result.months[4].fixedCost).toBe(0);
  });

  it('price-change overrides avgCheck from event month', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 4,
          label: 'Price increase',
          delta: {
            type: 'price-change',
            data: { newAvgCheck: 200 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Months 1-3: base avgCheck = 100, revenue = 50 * 100 = 5000
    for (let i = 0; i < 3; i++) {
      expect(result.months[i].revenue).toBe(5000);
      expect(result.months[i].avgCheck).toBe(100);
    }

    // Month 4+: avgCheck = 200, revenue = 50 * 200 = 10000
    for (let i = 3; i < 12; i++) {
      expect(result.months[i].revenue).toBe(10000);
      expect(result.months[i].avgCheck).toBe(200);
    }
  });

  it('equipment-purchase has one-time cost plus ongoing maintenance and capacity', () => {
    const input = makeInput({
      operations: makeOps({
        capacityItems: [
          {
            id: 'cap-1',
            name: 'Main',
            outputUnitLabel: 'units',
            plannedOutputPerMonth: 100,
            maxOutputPerDay: 0,
            maxOutputPerWeek: 0,
            maxOutputPerMonth: 0,
            utilizationRate: 0,
          },
        ],
      }),
      events: [
        makeEvent({
          month: 3,
          label: 'Buy CNC machine',
          delta: {
            type: 'equipment-purchase',
            data: { purchaseCost: 50000, capacityIncrease: 20, maintenanceCostMonthly: 500 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Month 1-2: no effect
    expect(result.months[0].fixedCost).toBe(0);
    expect(result.months[0].plannedOutput).toBe(100);
    expect(result.months[1].fixedCost).toBe(0);

    // Month 3: one-time purchase + ongoing maintenance = 50000 + 500
    expect(result.months[2].fixedCost).toBe(50500);
    expect(result.months[2].plannedOutput).toBe(120);

    // Month 4: only ongoing maintenance = 500, capacity still +20
    expect(result.months[3].fixedCost).toBe(500);
    expect(result.months[3].plannedOutput).toBe(120);

    // Month 12: same
    expect(result.months[11].fixedCost).toBe(500);
    expect(result.months[11].plannedOutput).toBe(120);
  });

  it('seasonal-campaign increases marketing budget only during duration', () => {
    const input = makeInput({
      events: [
        makeEvent({
          month: 3,
          label: 'Summer push',
          durationMonths: 3,
          delta: {
            type: 'seasonal-campaign',
            data: { budgetIncrease: 5000 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Months 1-2: no effect, base marketing = 1000
    expect(result.months[0].marketingBudget).toBe(1000);
    expect(result.months[1].marketingBudget).toBe(1000);

    // Months 3-5: marketing budget = 1000 base (budget) + 5000 increase via totalCost
    // marketingBudget stays at 1000 (base), but marketing cost includes +5000 via customMarketingDelta
    // Let's check totalCost difference
    const baseTotalCost = result.months[0].totalCost; // month 1: just marketing 1000
    const boostedTotalCost = result.months[2].totalCost; // month 3: marketing 1000 + 5000
    expect(boostedTotalCost - baseTotalCost).toBe(5000);
    expect(result.months[3].totalCost - baseTotalCost).toBe(5000); // month 4
    expect(result.months[4].totalCost - baseTotalCost).toBe(5000); // month 5

    // Month 6+: reverts, no effect
    expect(result.months[5].totalCost).toBe(baseTotalCost); // month 6
    expect(result.months[11].totalCost).toBe(baseTotalCost); // month 12
  });

  it('duration event with durationMonths=1 acts like instant event', () => {
    const input = makeInput({
      operations: makeOps({
        capacityItems: [
          {
            id: 'cap-1',
            name: 'Main',
            outputUnitLabel: 'units',
            plannedOutputPerMonth: 100,
            maxOutputPerDay: 0,
            maxOutputPerWeek: 0,
            maxOutputPerMonth: 0,
            utilizationRate: 0,
          },
        ],
      }),
      events: [
        makeEvent({
          month: 5,
          label: 'Quick build',
          durationMonths: 1,
          delta: {
            type: 'facility-build',
            data: { constructionCost: 60000, monthlyRent: 2000, capacityAdded: 30 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Month 5: full construction cost (60000/1 = 60000)
    expect(result.months[4].fixedCost).toBe(60000);
    expect(result.months[4].plannedOutput).toBe(100); // not yet completed

    // Month 6+: rent + capacity
    expect(result.months[5].fixedCost).toBe(2000);
    expect(result.months[5].plannedOutput).toBe(130);
  });

  it('duration event without durationMonths defaults to 1', () => {
    const input = makeInput({
      operations: makeOps({
        capacityItems: [
          {
            id: 'cap-1',
            name: 'Main',
            outputUnitLabel: 'units',
            plannedOutputPerMonth: 100,
            maxOutputPerDay: 0,
            maxOutputPerWeek: 0,
            maxOutputPerMonth: 0,
            utilizationRate: 0,
          },
        ],
      }),
      events: [
        makeEvent({
          month: 5,
          label: 'Quick build no duration',
          // no durationMonths set
          delta: {
            type: 'facility-build',
            data: { constructionCost: 60000, monthlyRent: 2000, capacityAdded: 30 },
          },
        }),
      ],
    });

    const result = computeGrowthTimeline(input);

    // Same behavior as durationMonths=1
    expect(result.months[4].fixedCost).toBe(60000);
    expect(result.months[4].plannedOutput).toBe(100);

    expect(result.months[5].fixedCost).toBe(2000);
    expect(result.months[5].plannedOutput).toBe(130);
  });
});
