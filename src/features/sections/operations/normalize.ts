import type { Operations, WorkforceMember, CostItem, CapacityConfig, OperationalMetric } from '@/types';

// Legacy types for backward-compatible normalization
// These match the old event-based Operations format stored in Firestore

interface LegacyCrewMember {
  role: string;
  hourlyRate: number;
  count: number;
}

interface LegacyCustomExpense {
  name: string;
  amount: number;
  type: 'per-event' | 'monthly';
}

interface LegacyCostBreakdown {
  // Variable costs per event
  suppliesPerChild: number;
  participantsPerEvent: number;
  museumTicketPrice: number;
  ticketsPerEvent: number;
  fuelPricePerGallon: number;
  vehicleMPG: number;
  avgRoundTripMiles: number;
  parkingPerEvent: number;

  // Monthly team salaries (core team)
  ownerSalary: number;
  marketingPerson: number;
  eventCoordinator: number;

  // Monthly vehicle costs
  vehiclePayment: number;
  vehicleInsurance: number;
  vehicleMaintenance: number;

  // Monthly IT & software
  crmSoftware: number;
  websiteHosting: number;
  aiChatbot: number;
  cloudServices: number;
  phonePlan: number;

  // Monthly marketing overhead
  contentCreation: number;
  graphicDesign: number;

  // Monthly other overhead
  storageRent: number;
  equipmentAmortization: number;
  businessLicenses: number;
  miscFixed: number;

  // Custom expenses
  customExpenses: LegacyCustomExpense[];
}

interface LegacyOperations {
  crew?: LegacyCrewMember[];
  hoursPerEvent?: number;
  capacity?: {
    maxBookingsPerDay?: number;
    maxBookingsPerWeek?: number;
    maxBookingsPerMonth?: number;
  };
  travelRadius?: number;
  equipment?: string[];
  safetyProtocols?: string[];
  costBreakdown?: Partial<LegacyCostBreakdown>;
}

const defaultCapacity: CapacityConfig = {
  outputUnitLabel: '',
  plannedOutputPerMonth: 0,
  maxOutputPerDay: 0,
  maxOutputPerWeek: 0,
  maxOutputPerMonth: 0,
  utilizationRate: 0,
};

const defaultOperations: Operations = {
  workforce: [],
  capacity: { ...defaultCapacity },
  costItems: [],
  equipment: [],
  safetyProtocols: [],
  operationalMetrics: [],
};

/** Convert legacy crew members to workforce members. */
function migrateCrewToWorkforce(crew: LegacyCrewMember[]): WorkforceMember[] {
  return crew.map((m) => ({
    role: m.role,
    count: m.count,
    ratePerHour: m.hourlyRate,
  }));
}

/** Convert legacy capacity to new CapacityConfig. */
function migrateCapacity(
  cap: NonNullable<LegacyOperations['capacity']>,
): CapacityConfig {
  return {
    outputUnitLabel: 'bookings',
    plannedOutputPerMonth: cap.maxBookingsPerMonth ?? 0,
    maxOutputPerDay: cap.maxBookingsPerDay ?? 0,
    maxOutputPerWeek: cap.maxBookingsPerWeek ?? 0,
    maxOutputPerMonth: cap.maxBookingsPerMonth ?? 0,
    utilizationRate: 0,
  };
}

/** Migrate legacy CostBreakdown to generic CostItem[]. */
function migrateCostBreakdown(
  cb: Partial<LegacyCostBreakdown>,
  monthlyBookings: number,
): CostItem[] {
  const items: CostItem[] = [];

  // --- Variable costs (per-unit driver) ---

  const suppliesPerChild = cb.suppliesPerChild ?? 0;
  const participantsPerEvent = cb.participantsPerEvent ?? 1;
  if (suppliesPerChild > 0) {
    items.push({
      category: 'Supplies',
      type: 'variable',
      rate: suppliesPerChild * participantsPerEvent,
      driverType: 'per-unit',
      driverQuantityPerMonth: monthlyBookings,
    });
  }

  const museumTicketPrice = cb.museumTicketPrice ?? 0;
  const ticketsPerEvent = cb.ticketsPerEvent ?? 1;
  if (museumTicketPrice > 0) {
    items.push({
      category: 'Venue / Tickets',
      type: 'variable',
      rate: museumTicketPrice * ticketsPerEvent,
      driverType: 'per-unit',
      driverQuantityPerMonth: monthlyBookings,
    });
  }

  const fuelPricePerGallon = cb.fuelPricePerGallon ?? 0;
  const vehicleMPG = cb.vehicleMPG ?? 1;
  const avgRoundTripMiles = cb.avgRoundTripMiles ?? 0;
  const parkingPerEvent = cb.parkingPerEvent ?? 0;
  const fuelCost =
    (avgRoundTripMiles / Math.max(vehicleMPG, 1)) * fuelPricePerGallon +
    parkingPerEvent;
  if (fuelCost > 0) {
    items.push({
      category: 'Transportation',
      type: 'variable',
      rate: fuelCost,
      driverType: 'per-unit',
      driverQuantityPerMonth: monthlyBookings,
    });
  }

  // --- Fixed costs (monthly driver) ---

  const fixedFields: [keyof LegacyCostBreakdown, string][] = [
    ['ownerSalary', 'Owner Salary'],
    ['marketingPerson', 'Marketing Person'],
    ['eventCoordinator', 'Event Coordinator'],
    ['vehiclePayment', 'Vehicle Payment'],
    ['vehicleMaintenance', 'Vehicle Maintenance'],
    ['vehicleInsurance', 'Vehicle Insurance'],
    ['crmSoftware', 'CRM Software'],
    ['websiteHosting', 'Website Hosting'],
    ['aiChatbot', 'AI & Chatbot'],
    ['cloudServices', 'Cloud Services'],
    ['phonePlan', 'Phone Plan'],
    ['contentCreation', 'Content Creation'],
    ['graphicDesign', 'Graphic Design'],
    ['storageRent', 'Storage Rent'],
    ['equipmentAmortization', 'Equipment Amortization'],
    ['businessLicenses', 'Business Licenses'],
    ['miscFixed', 'Miscellaneous Fixed'],
  ];

  for (const [key, category] of fixedFields) {
    const val = cb[key];
    if (typeof val === 'number' && val > 0) {
      items.push({
        category,
        type: 'fixed',
        rate: val,
        driverType: 'monthly',
        driverQuantityPerMonth: 1,
      });
    }
  }

  // --- Custom expenses ---

  const customs = cb.customExpenses ?? [];
  for (const exp of customs) {
    if (exp.amount > 0) {
      items.push({
        category: exp.name || 'Custom Expense',
        type: exp.type === 'per-event' ? 'variable' : 'fixed',
        rate: exp.amount,
        driverType: exp.type === 'per-event' ? 'per-unit' : 'monthly',
        driverQuantityPerMonth:
          exp.type === 'per-event' ? monthlyBookings : 1,
      });
    }
  }

  return items;
}

/** Ensure a capacity object has all required fields. */
function ensureCapacity(raw: Record<string, unknown>): CapacityConfig {
  return {
    outputUnitLabel:
      typeof raw.outputUnitLabel === 'string' ? raw.outputUnitLabel : '',
    plannedOutputPerMonth:
      typeof raw.plannedOutputPerMonth === 'number'
        ? raw.plannedOutputPerMonth
        : 0,
    maxOutputPerDay:
      typeof raw.maxOutputPerDay === 'number' ? raw.maxOutputPerDay : 0,
    maxOutputPerWeek:
      typeof raw.maxOutputPerWeek === 'number' ? raw.maxOutputPerWeek : 0,
    maxOutputPerMonth:
      typeof raw.maxOutputPerMonth === 'number' ? raw.maxOutputPerMonth : 0,
    utilizationRate:
      typeof raw.utilizationRate === 'number' ? raw.utilizationRate : 0,
  };
}

/**
 * Normalize raw Firestore data to the current Operations format.
 *
 * Handles three cases:
 * 1. New format (has `workforce` array + `costItems` array) — pass through, ensure defaults
 * 2. Legacy format (has `crew` array + `costBreakdown` object) — migrate to generic model
 * 3. Empty/null input — return default empty Operations
 *
 * When both `workforce` and `crew` exist, `workforce` takes precedence.
 */
export function normalizeOperations(raw: unknown): Operations {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultOperations, capacity: { ...defaultCapacity } };
  }

  const data = raw as Record<string, unknown>;

  // Case 1: New format — workforce array exists
  if (Array.isArray(data.workforce)) {
    const workforce = (data.workforce as WorkforceMember[]).map((w) => ({
      role: w.role ?? '',
      count: typeof w.count === 'number' ? w.count : 0,
      ratePerHour: typeof w.ratePerHour === 'number' ? w.ratePerHour : 0,
    }));

    const capacity =
      data.capacity && typeof data.capacity === 'object'
        ? ensureCapacity(data.capacity as Record<string, unknown>)
        : { ...defaultCapacity };

    const costItems = Array.isArray(data.costItems)
      ? (data.costItems as CostItem[])
      : [];

    const equipment = Array.isArray(data.equipment)
      ? (data.equipment as string[])
      : [];

    const safetyProtocols = Array.isArray(data.safetyProtocols)
      ? (data.safetyProtocols as string[])
      : [];

    const operationalMetrics = Array.isArray(data.operationalMetrics)
      ? (data.operationalMetrics as OperationalMetric[])
      : [];

    return {
      workforce,
      capacity,
      costItems,
      equipment,
      safetyProtocols,
      operationalMetrics,
    };
  }

  // Case 2: Legacy format — crew array exists
  if (Array.isArray(data.crew)) {
    const legacy = data as unknown as LegacyOperations;
    const workforce = migrateCrewToWorkforce(legacy.crew ?? []);

    const capacity = legacy.capacity
      ? migrateCapacity(legacy.capacity)
      : { ...defaultCapacity };

    const monthlyBookings = capacity.maxOutputPerMonth;
    const costItems = legacy.costBreakdown
      ? migrateCostBreakdown(legacy.costBreakdown, monthlyBookings)
      : [];

    const equipment = Array.isArray(legacy.equipment)
      ? legacy.equipment
      : [];

    const safetyProtocols = Array.isArray(legacy.safetyProtocols)
      ? legacy.safetyProtocols
      : [];

    return {
      workforce,
      capacity,
      costItems,
      equipment,
      safetyProtocols,
      operationalMetrics: [],
    };
  }

  // Case 3: Neither exists — return default
  return { ...defaultOperations, capacity: { ...defaultCapacity } };
}
