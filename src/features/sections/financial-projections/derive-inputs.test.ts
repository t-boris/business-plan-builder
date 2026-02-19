import { describe, expect, it } from 'vitest';
import type {
  MarketingStrategy,
  Operations,
  ProductService,
} from '@/types';
import { deriveFinancialInputsFromSections } from './derive-inputs';

function makeProductService(overrides: Partial<ProductService> = {}): ProductService {
  return {
    overview: '',
    offerings: [],
    addOns: [],
    ...overrides,
  };
}

function makeOperations(overrides: Partial<Operations> = {}): Operations {
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

function makeMarketing(overrides: Partial<MarketingStrategy> = {}): MarketingStrategy {
  return {
    channels: [],
    offers: [],
    landingPage: { url: '', description: '' },
    ...overrides,
  };
}

describe('deriveFinancialInputsFromSections', () => {
  it('derives price, output, costs, and marketing from linked sections', () => {
    const productService = makeProductService({
      offerings: [
        { id: 'o1', name: 'A', description: '', price: 100, addOnIds: [] },
        { id: 'o2', name: 'B', description: '', price: 200, addOnIds: [] },
      ],
    });

    const operations = makeOperations({
      workforce: [{ role: 'Operator', count: 1, ratePerHour: 25, hoursPerWeek: 40 }],
      capacityItems: [
        {
          id: 'c1',
          name: 'Line A',
          offeringId: 'o1',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 80,
          maxOutputPerDay: 5,
          maxOutputPerWeek: 25,
          maxOutputPerMonth: 100,
          utilizationRate: 80,
        },
        {
          id: 'c2',
          name: 'Line B',
          offeringId: 'o2',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 20,
          maxOutputPerDay: 2,
          maxOutputPerWeek: 10,
          maxOutputPerMonth: 25,
          utilizationRate: 70,
        },
      ],
      costItems: [
        {
          category: 'Materials',
          type: 'variable',
          rate: 10,
          driverType: 'per-unit',
          driverQuantityPerMonth: 100,
        },
        {
          category: 'Rent',
          type: 'fixed',
          rate: 3000,
          driverType: 'monthly',
          driverQuantityPerMonth: 1,
        },
      ],
    });

    const marketing = makeMarketing({
      channels: [
        {
          name: 'Meta Ads',
          budget: 500,
          expectedLeads: 0,
          expectedCAC: 0,
          description: '',
          tactics: [],
        },
        {
          name: 'Google Ads',
          budget: 300,
          expectedLeads: 0,
          expectedCAC: 0,
          description: '',
          tactics: [],
        },
      ],
    });

    const result = deriveFinancialInputsFromSections(
      productService,
      operations,
      marketing,
    );

    expect(result.baseOutputPerMonth).toBe(100);
    expect(result.totalMaxOutputPerMonth).toBe(125);
    expect(result.averagePricePerOutput).toBe(120);
    expect(result.variableCostPerOutput).toBe(10);
    // Fixed: 3000 + Workforce: 25*40*1*(52/12) ≈ 7333.33
    expect(result.monthlyFixedOverhead).toBeCloseTo(7333.33, 0);
    expect(result.monthlyMarketing).toBe(800);
    expect(result.hasCapacityOutput).toBe(true);
    expect(result.hasPriceSignal).toBe(true);
  });

  it('uses offering average price fallback for unlinked capacity', () => {
    const productService = makeProductService({
      offerings: [
        { id: 'o1', name: 'A', description: '', price: 100, addOnIds: [] },
        { id: 'o2', name: 'B', description: '', price: 200, addOnIds: [] },
      ],
    });

    const operations = makeOperations({
      capacityItems: [
        {
          id: 'c1',
          name: 'Unlinked',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 50,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
    });

    const result = deriveFinancialInputsFromSections(
      productService,
      operations,
      makeMarketing(),
    );

    expect(result.baseOutputPerMonth).toBe(50);
    expect(result.averagePricePerOutput).toBe(150);
    expect(result.hasPriceSignal).toBe(true);
  });

  it('returns no price signal when offerings do not have prices', () => {
    const productService = makeProductService({
      offerings: [
        { id: 'o1', name: 'A', description: '', price: null, addOnIds: [] },
      ],
    });

    const operations = makeOperations({
      capacityItems: [
        {
          id: 'c1',
          name: 'Line',
          offeringId: 'o1',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 40,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
    });

    const result = deriveFinancialInputsFromSections(
      productService,
      operations,
      makeMarketing(),
    );

    expect(result.baseOutputPerMonth).toBe(40);
    expect(result.averagePricePerOutput).toBe(0);
    expect(result.hasCapacityOutput).toBe(true);
    expect(result.hasPriceSignal).toBe(false);
  });

  it('applies day/week capacity limits when max monthly is not set', () => {
    const productService = makeProductService({
      offerings: [
        { id: 'o1', name: 'A', description: '', price: 100, addOnIds: [] },
      ],
    });

    const operations = makeOperations({
      capacityItems: [
        {
          id: 'c1',
          name: 'Line',
          offeringId: 'o1',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 120,
          maxOutputPerDay: 4, // 120 / month
          maxOutputPerWeek: 20, // 80 / month
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
    });

    const result = deriveFinancialInputsFromSections(
      productService,
      operations,
      makeMarketing(),
    );

    // min(120, 20*(52/12)) = min(120, 86.67) ≈ 86.67
    expect(result.baseOutputPerMonth).toBeCloseTo(86.67, 0);
    expect(result.totalMaxOutputPerMonth).toBeCloseTo(86.67, 0);
    expect(result.averagePricePerOutput).toBe(100);
  });

  it('computes variable cost per output using effective (capacity-limited) output', () => {
    const productService = makeProductService({
      offerings: [
        { id: 'o1', name: 'A', description: '', price: 100, addOnIds: [] },
      ],
    });

    const operations = makeOperations({
      capacityItems: [
        {
          id: 'c1',
          name: 'Line',
          offeringId: 'o1',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 100,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 10,
          utilizationRate: 0,
        },
      ],
      variableComponents: [
        {
          id: 'vc1',
          name: 'Material',
          offeringId: 'o1',
          sourcingModel: 'purchase-order',
          supplier: '',
          componentUnitLabel: 'kg',
          costPerComponentUnit: 2,
          componentUnitsPerOutput: 1,
          orderQuantity: 100,
          orderFee: 0,
        },
      ],
    });

    const result = deriveFinancialInputsFromSections(
      productService,
      operations,
      makeMarketing(),
    );

    // Variable monthly total is based on planned output (100 * 2 = 200),
    // while per-output denominator must follow effective output (10).
    expect(result.baseOutputPerMonth).toBe(10);
    expect(result.variableCostPerOutput).toBe(20);
  });
});
