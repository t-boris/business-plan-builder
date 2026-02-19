import { describe, it, expect } from 'vitest';
import { normalizeOperations } from './normalize';

describe('normalizeOperations', () => {
  it('returns default for null/undefined/empty input', () => {
    const defaultResult = {
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
        { role: 'Engineer', count: 3, ratePerHour: 75 },
        { role: 'Designer', count: 1, ratePerHour: 60 },
      ],
      capacity: {
        outputUnitLabel: 'units',
        plannedOutputPerMonth: 500,
        maxOutputPerDay: 30,
        maxOutputPerWeek: 150,
        maxOutputPerMonth: 600,
        utilizationRate: 83,
      },
      costItems: [
        { category: 'Raw Materials', type: 'variable', rate: 12, driverType: 'per-unit', driverQuantityPerMonth: 500 },
        { category: 'Rent', type: 'fixed', rate: 3000, driverType: 'monthly', driverQuantityPerMonth: 1 },
      ],
      equipment: ['CNC Machine', '3D Printer'],
      safetyProtocols: ['Wear goggles', 'Fire extinguisher nearby'],
      operationalMetrics: [
        { name: 'Yield Rate', unit: '%', value: 95, target: 98 },
      ],
    };

    const result = normalizeOperations(input);

    expect(result.workforce).toHaveLength(2);
    expect(result.workforce[0]).toEqual({ role: 'Engineer', count: 3, ratePerHour: 75 });
    expect(result.workforce[1]).toEqual({ role: 'Designer', count: 1, ratePerHour: 60 });
    expect(result.capacity.outputUnitLabel).toBe('units');
    expect(result.capacity.plannedOutputPerMonth).toBe(500);
    expect(result.capacity.maxOutputPerDay).toBe(30);
    expect(result.capacity.maxOutputPerWeek).toBe(150);
    expect(result.capacity.maxOutputPerMonth).toBe(600);
    expect(result.capacity.utilizationRate).toBe(83);
    expect(result.costItems).toHaveLength(2);
    expect(result.costItems[0].category).toBe('Raw Materials');
    expect(result.costItems[1].category).toBe('Rent');
    expect(result.equipment).toEqual(['CNC Machine', '3D Printer']);
    expect(result.safetyProtocols).toEqual(['Wear goggles', 'Fire extinguisher nearby']);
    expect(result.operationalMetrics).toHaveLength(1);
    expect(result.operationalMetrics[0]).toEqual({ name: 'Yield Rate', unit: '%', value: 95, target: 98 });
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
    expect(result.workforce[0]).toEqual({ role: 'Event Manager', ratePerHour: 35, count: 2 });
    expect(result.workforce[1]).toEqual({ role: 'Assistant', ratePerHour: 18, count: 4 });
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

    expect(result.capacity.outputUnitLabel).toBe('bookings');
    expect(result.capacity.maxOutputPerDay).toBe(3);
    expect(result.capacity.maxOutputPerWeek).toBe(15);
    expect(result.capacity.maxOutputPerMonth).toBe(60);
    expect(result.capacity.plannedOutputPerMonth).toBe(60);
    expect(result.capacity.utilizationRate).toBe(0);
  });

  it('migrates legacy costBreakdown variable costs to costItems', () => {
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

    const suppliesItem = result.costItems.find((i) => i.category === 'Supplies');
    expect(suppliesItem).toBeDefined();
    expect(suppliesItem!.type).toBe('variable');
    expect(suppliesItem!.rate).toBe(100); // 5 * 20
    expect(suppliesItem!.driverType).toBe('per-unit');
    expect(suppliesItem!.driverQuantityPerMonth).toBe(40);

    const venueItem = result.costItems.find((i) => i.category === 'Venue / Tickets');
    expect(venueItem).toBeDefined();
    expect(venueItem!.type).toBe('variable');
    expect(venueItem!.rate).toBe(200); // 10 * 20
    expect(venueItem!.driverType).toBe('per-unit');
    expect(venueItem!.driverQuantityPerMonth).toBe(40);
  });

  it('migrates legacy costBreakdown fixed costs to costItems', () => {
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
    expect(salary!.driverQuantityPerMonth).toBe(1);

    const crm = result.costItems.find((i) => i.category === 'CRM Software');
    expect(crm).toBeDefined();
    expect(crm!.type).toBe('fixed');
    expect(crm!.rate).toBe(50);

    const storage = result.costItems.find((i) => i.category === 'Storage Rent');
    expect(storage).toBeDefined();
    expect(storage!.type).toBe('fixed');
    expect(storage!.rate).toBe(200);
  });

  it('migrates legacy customExpenses to costItems', () => {
    const input = {
      crew: [],
      costBreakdown: {
        customExpenses: [
          { name: 'DJ Rental', amount: 150, type: 'per-event' },
          { name: 'Insurance Premium', amount: 300, type: 'monthly' },
        ],
      },
    };

    const result = normalizeOperations(input);

    const djItem = result.costItems.find((i) => i.category === 'DJ Rental');
    expect(djItem).toBeDefined();
    expect(djItem!.type).toBe('variable');
    expect(djItem!.rate).toBe(150);
    expect(djItem!.driverType).toBe('per-unit');

    const insurance = result.costItems.find((i) => i.category === 'Insurance Premium');
    expect(insurance).toBeDefined();
    expect(insurance!.type).toBe('fixed');
    expect(insurance!.rate).toBe(300);
    expect(insurance!.driverType).toBe('monthly');
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
    expect(result.costItems).toEqual([]);
    expect(result.equipment).toEqual([]);
    expect(result.safetyProtocols).toEqual([]);
    expect(result.operationalMetrics).toEqual([]);
    expect(result.capacity.outputUnitLabel).toBe('');
  });
});
