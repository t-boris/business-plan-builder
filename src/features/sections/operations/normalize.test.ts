import { describe, it, expect } from 'vitest';
import { normalizeOperations } from './normalize';

describe('normalizeOperations', () => {
  it('returns default for null/undefined/empty input', () => {
    const defaultResult = {
      workforce: [],
      capacityItems: [],
      variableComponents: [],
      costItems: [],
      equipment: [],
      safetyProtocols: [],
      operationalMetrics: [],
    };

    expect(normalizeOperations(null)).toEqual(defaultResult);
    expect(normalizeOperations(undefined)).toEqual(defaultResult);
    expect(normalizeOperations({})).toEqual(defaultResult);
    expect(normalizeOperations('')).toEqual(defaultResult);
    expect(normalizeOperations(0)).toEqual(defaultResult);
  });

  it('passes through new format data', () => {
    const input = {
      workforce: [
        { role: 'Engineer', count: 3, ratePerHour: 75, hoursPerWeek: 40 },
      ],
      capacityItems: [
        {
          id: 'cap-1',
          name: 'Standard Product',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 500,
          maxOutputPerDay: 30,
          maxOutputPerWeek: 150,
          maxOutputPerMonth: 600,
          utilizationRate: 83,
        },
      ],
      variableComponents: [
        {
          id: 'var-1',
          name: 'Raw Material',
          offeringId: 'off-1',
          sourcingModel: 'purchase-order',
          componentUnitLabel: 'kg',
          costPerComponentUnit: 2.5,
          componentUnitsPerOutput: 1.2,
          orderQuantity: 500,
          orderFee: 45,
        },
      ],
      costItems: [
        { category: 'Rent', type: 'fixed', rate: 3000, driverType: 'monthly', driverQuantityPerMonth: 1 },
      ],
      equipment: ['CNC Machine'],
      safetyProtocols: ['Wear goggles'],
      operationalMetrics: [
        { name: 'Yield Rate', unit: '%', value: 95, target: 98 },
      ],
    };

    const result = normalizeOperations(input);

    expect(result.workforce).toHaveLength(1);
    expect(result.capacityItems).toHaveLength(1);
    expect(result.variableComponents).toHaveLength(1);
    expect(result.variableComponents[0].id).toBe('var-1');
    expect(result.variableComponents[0].sourcingModel).toBe('purchase-order');
    expect(result.costItems).toHaveLength(1);
    expect(result.costItems[0].type).toBe('fixed');
  });

  it('migrates legacy crew to workforce', () => {
    const input = {
      crew: [
        { role: 'Event Manager', hourlyRate: 35, count: 2 },
        { role: 'Assistant', hourlyRate: 18, count: 4 },
      ],
    };

    const result = normalizeOperations(input);

    expect(result.workforce).toHaveLength(2);
    expect(result.workforce[0]).toEqual({ role: 'Event Manager', ratePerHour: 35, count: 2, hoursPerWeek: 40 });
    expect(result.workforce[1]).toEqual({ role: 'Assistant', ratePerHour: 18, count: 4, hoursPerWeek: 40 });
  });

  it('migrates legacy capacity fields', () => {
    const input = {
      crew: [],
      capacity: {
        maxBookingsPerDay: 3,
        maxBookingsPerWeek: 15,
        maxBookingsPerMonth: 60,
      },
    };

    const result = normalizeOperations(input);

    expect(result.capacityItems).toHaveLength(1);
    expect(result.capacityItems[0].outputUnitLabel).toBe('bookings');
    expect(result.capacityItems[0].maxOutputPerDay).toBe(3);
    expect(result.capacityItems[0].maxOutputPerWeek).toBe(15);
    expect(result.capacityItems[0].maxOutputPerMonth).toBe(60);
    expect(result.capacityItems[0].plannedOutputPerMonth).toBe(60);
  });

  it('migrates legacy variable costs to variable components', () => {
    const input = {
      crew: [],
      capacity: { maxBookingsPerDay: 2, maxBookingsPerWeek: 10, maxBookingsPerMonth: 40 },
      costBreakdown: {
        suppliesPerChild: 5,
        participantsPerEvent: 20,
        museumTicketPrice: 10,
        ticketsPerEvent: 20,
      },
    };

    const result = normalizeOperations(input);

    expect(result.variableComponents.length).toBeGreaterThan(0);
    const supplies = result.variableComponents.find((c) => c.name === 'Supplies');
    const venue = result.variableComponents.find((c) => c.name === 'Venue / Tickets');
    expect(supplies).toBeDefined();
    expect(venue).toBeDefined();
    // Monthly total preserved: output (40) * units/output (1) * rate (100) = 4000
    expect(supplies!.costPerComponentUnit).toBe(100);
    expect(supplies!.componentUnitsPerOutput).toBe(1);
  });

  it('migrates legacy fixed costs to fixed cost items', () => {
    const input = {
      crew: [],
      costBreakdown: {
        ownerSalary: 4000,
        crmSoftware: 50,
        storageRent: 200,
      },
    };

    const result = normalizeOperations(input);

    const salary = result.costItems.find((i) => i.category === 'Owner Salary');
    expect(salary).toBeDefined();
    expect(salary!.type).toBe('fixed');
    expect(salary!.rate).toBe(4000);
    expect(salary!.driverType).toBe('monthly');
  });

  it('splits legacy custom expenses into variable components and fixed items', () => {
    const input = {
      crew: [],
      capacity: { maxBookingsPerDay: 2, maxBookingsPerWeek: 10, maxBookingsPerMonth: 40 },
      costBreakdown: {
        customExpenses: [
          { name: 'DJ Rental', amount: 150, type: 'per-event' },
          { name: 'Insurance Premium', amount: 300, type: 'monthly' },
        ],
      },
    };

    const result = normalizeOperations(input);

    const djComponent = result.variableComponents.find((c) => c.name === 'DJ Rental');
    const insurance = result.costItems.find((i) => i.category === 'Insurance Premium');
    expect(djComponent).toBeDefined();
    expect(insurance).toBeDefined();
    expect(insurance!.type).toBe('fixed');
  });

  it('preserves equipment and safetyProtocols', () => {
    const input = {
      crew: [],
      equipment: ['Van', 'Sound System', 'Tables'],
      safetyProtocols: ['First aid kit present', 'Emergency plan posted'],
    };

    const result = normalizeOperations(input);

    expect(result.equipment).toEqual(['Van', 'Sound System', 'Tables']);
    expect(result.safetyProtocols).toEqual(['First aid kit present', 'Emergency plan posted']);
  });

  it('adds empty operationalMetrics for legacy data', () => {
    const input = {
      crew: [{ role: 'Manager', hourlyRate: 40, count: 1 }],
    };

    const result = normalizeOperations(input);

    expect(result.operationalMetrics).toEqual([]);
  });

  it('handles new format with missing optional arrays gracefully', () => {
    const input = {
      workforce: [{ role: 'Clerk', count: 1, ratePerHour: 20 }],
    };

    const result = normalizeOperations(input);

    expect(result.workforce).toHaveLength(1);
    expect(result.workforce[0].hoursPerWeek).toBe(40);
    expect(result.variableComponents).toEqual([]);
    expect(result.costItems).toEqual([]);
    expect(result.equipment).toEqual([]);
    expect(result.safetyProtocols).toEqual([]);
    expect(result.operationalMetrics).toEqual([]);
    expect(result.capacityItems).toEqual([]);
  });

  it('migrates transitional single capacity object into capacityItems', () => {
    const input = {
      workforce: [{ role: 'Operator', count: 1, ratePerHour: 30, hoursPerWeek: 40 }],
      capacity: {
        outputUnitLabel: 'orders',
        plannedOutputPerMonth: 120,
        maxOutputPerDay: 6,
        maxOutputPerWeek: 30,
        maxOutputPerMonth: 140,
        utilizationRate: 80,
      },
    };

    const result = normalizeOperations(input);

    expect(result.capacityItems).toHaveLength(1);
    expect(result.capacityItems[0].id).toBe('cap-primary');
    expect(result.capacityItems[0].name).toBe('Primary Capacity');
    expect(result.capacityItems[0].outputUnitLabel).toBe('orders');
    expect(result.capacityItems[0].plannedOutputPerMonth).toBe(120);
  });

  it('migrates variable costItems in current shape into variable components', () => {
    const input = {
      capacityItems: [
        {
          id: 'cap-1',
          name: 'Primary',
          outputUnitLabel: 'units',
          plannedOutputPerMonth: 100,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
      costItems: [
        { category: 'Packaging', type: 'variable', rate: 2, driverType: 'per-unit', driverQuantityPerMonth: 100 },
        { category: 'Rent', type: 'fixed', rate: 3000, driverType: 'monthly', driverQuantityPerMonth: 1 },
      ],
    };

    const result = normalizeOperations(input);

    expect(result.variableComponents).toHaveLength(1);
    expect(result.variableComponents[0].name).toBe('Packaging');
    expect(result.costItems).toHaveLength(1);
    expect(result.costItems[0].category).toBe('Rent');
    expect(result.costItems[0].type).toBe('fixed');
  });
});

