import { describe, it, expect } from 'vitest';
import { computeOperationsCosts } from './compute';
import type { Operations } from '@/types';

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

describe('computeOperationsCosts', () => {
  it('returns zeros for empty operations', () => {
    const result = computeOperationsCosts(makeOps());

    expect(result.variableMonthlyTotal).toBe(0);
    expect(result.fixedMonthlyTotal).toBe(0);
    expect(result.workforceMonthlyTotal).toBe(0);
    expect(result.monthlyOperationsTotal).toBe(0);
    expect(result.variableCostPerOutput).toBe(0);
    expect(result.variableComponentCosts).toEqual([]);
    expect(result.variableCostByOffering).toEqual([]);
  });

  it('computes variable cost components per product output', () => {
    const ops = makeOps({
      capacityItems: [
        {
          id: 'cap-1',
          name: 'Product A',
          offeringId: 'off-1',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 100,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
      variableComponents: [
        {
          id: 'var-1',
          name: 'Material A',
          offeringId: 'off-1',
          sourcingModel: 'in-house',
          componentUnitLabel: 'kg',
          costPerComponentUnit: 5,
          componentUnitsPerOutput: 1.2,
          orderQuantity: 0,
          orderFee: 0,
        },
      ],
    });

    const result = computeOperationsCosts(ops);

    // required units = 100 * 1.2 = 120
    // monthly total = 120 * $5 = $600
    expect(result.variableMonthlyTotal).toBe(600);
    expect(result.variableCostPerOutput).toBe(6);
    expect(result.variableComponentCosts[0].requiredComponentUnits).toBe(120);
    expect(result.variableComponentCosts[0].monthlyTotal).toBe(600);
  });

  it('adds purchase-order fees to variable component total', () => {
    const ops = makeOps({
      capacityItems: [
        {
          id: 'cap-1',
          name: 'Product A',
          offeringId: 'off-1',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 100,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
      variableComponents: [
        {
          id: 'var-1',
          name: 'Part A',
          offeringId: 'off-1',
          sourcingModel: 'purchase-order',
          componentUnitLabel: 'part',
          costPerComponentUnit: 2,
          componentUnitsPerOutput: 1,
          orderQuantity: 30,
          orderFee: 10,
        },
      ],
    });

    const result = computeOperationsCosts(ops);

    // material: 100 * 1 * $2 = $200
    // orders: ceil(100 / 30) = 4 => order fee = $40
    // total = $240
    expect(result.variableMonthlyTotal).toBe(240);
    expect(result.variableComponentCosts[0].estimatedOrders).toBe(4);
    expect(result.variableComponentCosts[0].monthlyOrderCost).toBe(40);
  });

  it('applies order fees for on-demand sourcing too', () => {
    const ops = makeOps({
      capacityItems: [
        {
          id: 'cap-1',
          name: 'Service A',
          offeringId: 'off-1',
          outputUnitLabel: 'orders',
          plannedOutputPerMonth: 45,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
      variableComponents: [
        {
          id: 'var-1',
          name: 'Subcontractor batch',
          offeringId: 'off-1',
          sourcingModel: 'on-demand',
          componentUnitLabel: 'job',
          costPerComponentUnit: 8,
          componentUnitsPerOutput: 1,
          orderQuantity: 20,
          orderFee: 15,
        },
      ],
    });

    const result = computeOperationsCosts(ops);

    // material: 45 * 1 * 8 = 360
    // orders: ceil(45 / 20) = 3 => order fee = 45
    // total = 405
    expect(result.variableMonthlyTotal).toBe(405);
    expect(result.variableComponentCosts[0].estimatedOrders).toBe(3);
    expect(result.variableComponentCosts[0].monthlyOrderCost).toBe(45);
  });

  it('groups variable costs by offering and shared bucket', () => {
    const ops = makeOps({
      capacityItems: [
        {
          id: 'cap-1',
          name: 'A',
          offeringId: 'off-a',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 80,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
        {
          id: 'cap-2',
          name: 'B',
          offeringId: 'off-b',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 20,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
      variableComponents: [
        {
          id: 'var-a',
          name: 'A material',
          offeringId: 'off-a',
          sourcingModel: 'in-house',
          componentUnitLabel: 'kg',
          costPerComponentUnit: 1,
          componentUnitsPerOutput: 1,
          orderQuantity: 0,
          orderFee: 0,
        },
        {
          id: 'var-shared',
          name: 'Shared packaging',
          sourcingModel: 'in-house',
          componentUnitLabel: 'unit',
          costPerComponentUnit: 0.5,
          componentUnitsPerOutput: 1,
          orderQuantity: 0,
          orderFee: 0,
        },
      ],
    });

    const result = computeOperationsCosts(ops);

    // off-a: 80*1*1 = 80
    // shared: (80+20)*1*0.5 = 50
    expect(result.variableMonthlyTotal).toBe(130);
    const offA = result.variableCostByOffering.find((v) => v.offeringId === 'off-a');
    const shared = result.variableCostByOffering.find((v) => v.offeringId == null);
    expect(offA?.monthlyVariableTotal).toBe(80);
    expect(shared?.monthlyVariableTotal).toBe(50);
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

    // 3000 + 1200/3 + 6000/12 = 3900
    expect(result.fixedMonthlyTotal).toBe(3900);
  });

  it('computes workforce monthly total', () => {
    const ops = makeOps({
      workforce: [
        { role: 'Engineer', count: 2, ratePerHour: 50, hoursPerWeek: 40 },
        { role: 'Manager', count: 1, ratePerHour: 75, hoursPerWeek: 30 },
      ],
    });

    const result = computeOperationsCosts(ops);

    // 2*50*40*(52/12) + 1*75*30*(52/12) = 4000*(52/12) + 2250*(52/12) ≈ 27083.33
    expect(result.workforceMonthlyTotal).toBeCloseTo(27083.33, 0);
  });

  it('computes total monthly operations across all cost types', () => {
    const ops = makeOps({
      capacityItems: [
        {
          id: 'cap-1',
          name: 'Primary',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 50,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
      workforce: [
        { role: 'Worker', count: 1, ratePerHour: 25, hoursPerWeek: 40 },
      ],
      variableComponents: [
        {
          id: 'var-1',
          name: 'Supplies',
          sourcingModel: 'in-house',
          componentUnitLabel: 'unit',
          costPerComponentUnit: 10,
          componentUnitsPerOutput: 1,
          orderQuantity: 0,
          orderFee: 0,
        },
      ],
      costItems: [
        { category: 'Rent', type: 'fixed', rate: 2000, driverType: 'monthly', driverQuantityPerMonth: 1 },
      ],
    });

    const result = computeOperationsCosts(ops);

    // Variable: 50 * 1 * 10 = 500
    // Fixed: 2000
    // Workforce: 25 * 40 * 1 * (52/12) ≈ 4333.33
    expect(result.variableMonthlyTotal).toBe(500);
    expect(result.fixedMonthlyTotal).toBe(2000);
    expect(result.workforceMonthlyTotal).toBeCloseTo(4333.33, 0);
    expect(result.monthlyOperationsTotal).toBeCloseTo(6833.33, 0);
  });

  it('aggregates capacity totals and weighted utilization from multiple items', () => {
    const ops = makeOps({
      capacityItems: [
        {
          id: 'cap-1',
          name: 'Product A',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 80,
          maxOutputPerDay: 4,
          maxOutputPerWeek: 20,
          maxOutputPerMonth: 100,
          utilizationRate: 70,
        },
        {
          id: 'cap-2',
          name: 'Product B',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 20,
          maxOutputPerDay: 2,
          maxOutputPerWeek: 10,
          maxOutputPerMonth: 30,
          utilizationRate: 40,
        },
      ],
    });

    const result = computeOperationsCosts(ops);

    expect(result.totalPlannedOutputPerMonth).toBe(100);
    expect(result.totalMaxOutputPerDay).toBe(6);
    expect(result.totalMaxOutputPerWeek).toBe(30);
    // cap-1 monthly limit: min(100, 20*(52/12), 4*30) = min(100, 86.67, 120) ≈ 86.67
    // cap-2 monthly limit: min(30, 10*(52/12), 2*30) = min(30, 43.33, 60) = 30
    expect(result.totalMaxOutputPerMonth).toBeCloseTo(116.67, 0);
    expect(result.weightedUtilizationRate).toBe(64);
    expect(result.primaryOutputUnitLabel).toBe('units');
  });

  it('derives max monthly capacity from day/week constraints when monthly is missing', () => {
    const ops = makeOps({
      capacityItems: [
        {
          id: 'cap-1',
          name: 'Line 1',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 0,
          maxOutputPerDay: 5, // 150 / month
          maxOutputPerWeek: 20, // 80 / month
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
        {
          id: 'cap-2',
          name: 'Line 2',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 0,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 40,
          utilizationRate: 0,
        },
      ],
    });

    const result = computeOperationsCosts(ops);

    // cap-1 -> min(5*30, 20*(52/12)) = min(150, 86.67) ≈ 86.67
    // cap-2 -> 40
    expect(result.totalMaxOutputPerMonth).toBeCloseTo(126.67, 0);
  });
});
