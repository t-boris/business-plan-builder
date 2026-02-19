import { describe, it, expect } from 'vitest';
import { computeOperationsCosts } from './compute';
import type { Operations } from '@/types';

function makeOps(overrides: Partial<Operations> = {}): Operations {
  return {
    workforce: [],
    capacity: {
      outputUnitLabel: '',
      plannedOutputPerMonth: 0,
      maxOutputPerDay: 0,
      maxOutputPerWeek: 0,
      maxOutputPerMonth: 0,
      utilizationRate: 0,
    },
    costItems: [],
    equipment: [],
    safetyProtocols: [],
    operationalMetrics: [],
    ...overrides,
  };
}

describe('computeOperationsCosts', () => {
  it('returns zeros for empty operations', () => {
    const result = computeOperationsCosts(makeOps());

    expect(result.variableMonthlyTotal).toBe(0);
    expect(result.fixedMonthlyTotal).toBe(0);
    expect(result.workforceMonthlyTotal).toBe(0);
    expect(result.monthlyOperationsTotal).toBe(0);
    expect(result.variableCostPerOutput).toBe(0);
  });

  it('sums variable costs correctly', () => {
    const ops = makeOps({
      costItems: [
        { category: 'Materials', type: 'variable', rate: 10, driverType: 'per-unit', driverQuantityPerMonth: 100 },
        { category: 'Packaging', type: 'variable', rate: 2, driverType: 'per-unit', driverQuantityPerMonth: 100 },
      ],
    });

    const result = computeOperationsCosts(ops);

    expect(result.variableMonthlyTotal).toBe(1200); // 10*100 + 2*100
  });

  it('sums fixed costs with monthly normalization', () => {
    const ops = makeOps({
      costItems: [
        { category: 'Rent', type: 'fixed', rate: 3000, driverType: 'monthly', driverQuantityPerMonth: 1 },
        { category: 'Insurance', type: 'fixed', rate: 1200, driverType: 'quarterly', driverQuantityPerMonth: 1 },
        { category: 'License', type: 'fixed', rate: 6000, driverType: 'yearly', driverQuantityPerMonth: 1 },
      ],
    });

    const result = computeOperationsCosts(ops);

    // 3000 + 1200/3 + 6000/12 = 3000 + 400 + 500 = 3900
    expect(result.fixedMonthlyTotal).toBe(3900);
  });

  it('computes workforce monthly total', () => {
    const ops = makeOps({
      workforce: [
        { role: 'Engineer', count: 2, ratePerHour: 50 },
        { role: 'Manager', count: 1, ratePerHour: 75 },
      ],
    });

    const result = computeOperationsCosts(ops);

    // Engineer: 50 * 2 * 160 = 16000
    // Manager: 75 * 1 * 160 = 12000
    // Total: 28000
    expect(result.workforceMonthlyTotal).toBe(28000);
  });

  it('computes variableCostPerOutput correctly', () => {
    const ops = makeOps({
      capacity: {
        outputUnitLabel: 'units',
        plannedOutputPerMonth: 100,
        maxOutputPerDay: 0,
        maxOutputPerWeek: 0,
        maxOutputPerMonth: 0,
        utilizationRate: 0,
      },
      costItems: [
        { category: 'Materials', type: 'variable', rate: 5, driverType: 'per-unit', driverQuantityPerMonth: 100 },
      ],
    });

    const result = computeOperationsCosts(ops);

    // variableMonthlyTotal = 5 * 100 = 500
    // variableCostPerOutput = 500 / 100 = 5
    expect(result.variableCostPerOutput).toBe(5);
  });

  it('returns 0 variableCostPerOutput when plannedOutputPerMonth is 0', () => {
    const ops = makeOps({
      costItems: [
        { category: 'Materials', type: 'variable', rate: 5, driverType: 'per-unit', driverQuantityPerMonth: 100 },
      ],
    });

    const result = computeOperationsCosts(ops);

    expect(result.variableMonthlyTotal).toBe(500);
    expect(result.variableCostPerOutput).toBe(0);
  });

  it('computes total monthly operations across all cost types', () => {
    const ops = makeOps({
      workforce: [
        { role: 'Worker', count: 1, ratePerHour: 25 },
      ],
      costItems: [
        { category: 'Supplies', type: 'variable', rate: 10, driverType: 'per-unit', driverQuantityPerMonth: 50 },
        { category: 'Rent', type: 'fixed', rate: 2000, driverType: 'monthly', driverQuantityPerMonth: 1 },
      ],
    });

    const result = computeOperationsCosts(ops);

    // Variable: 10 * 50 = 500
    // Fixed: 2000
    // Workforce: 25 * 1 * 160 = 4000
    // Total: 500 + 2000 + 4000 = 6500
    expect(result.variableMonthlyTotal).toBe(500);
    expect(result.fixedMonthlyTotal).toBe(2000);
    expect(result.workforceMonthlyTotal).toBe(4000);
    expect(result.monthlyOperationsTotal).toBe(6500);
  });
});
