import type {
  Operations,
  WorkforceMember,
  CostItem,
  CapacityItem,
  OperationalMetric,
  VariableCostComponent,
} from '@/types';

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

const defaultOperations: Operations = {
  workforce: [],
  capacityItems: [],
  variableComponents: [],
  costItems: [],
  equipment: [],
  safetyProtocols: [],
  operationalMetrics: [],
};
const DEFAULT_HOURS_PER_WEEK = 40;

/** Convert legacy crew members to workforce members. */
function migrateCrewToWorkforce(crew: LegacyCrewMember[]): WorkforceMember[] {
  return crew.map((m) => ({
    role: m.role,
    count: m.count,
    ratePerHour: m.hourlyRate,
    hoursPerWeek: DEFAULT_HOURS_PER_WEEK,
  }));
}

/** Convert legacy single capacity to one generic capacity item. */
function migrateCapacity(
  cap: NonNullable<LegacyOperations['capacity']>,
): CapacityItem[] {
  return [{
    id: 'cap-legacy-1',
    name: 'Primary Capacity',
    outputUnitLabel: 'bookings',
    plannedOutputPerMonth: cap.maxBookingsPerMonth ?? 0,
    maxOutputPerDay: cap.maxBookingsPerDay ?? 0,
    maxOutputPerWeek: cap.maxBookingsPerWeek ?? 0,
    maxOutputPerMonth: cap.maxBookingsPerMonth ?? 0,
    utilizationRate: 0,
  }];
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

function getDriverUnitLabel(driverType: CostItem['driverType']): string {
  switch (driverType) {
    case 'per-order':
      return 'order';
    case 'per-service-hour':
      return 'service-hour';
    case 'per-machine-hour':
      return 'machine-hour';
    default:
      return 'unit';
  }
}

function migrateVariableCostItemsToComponents(
  variableItems: CostItem[],
  monthlyOutputBasis: number,
): VariableCostComponent[] {
  return variableItems.map((item, index) => {
    const quantity = Math.max(0, item.driverQuantityPerMonth);
    const unitsPerOutput =
      monthlyOutputBasis > 0
        ? quantity / monthlyOutputBasis
        : 0;
    return {
      id: `var-legacy-${index + 1}`,
      name: item.category || `Variable Component ${index + 1}`,
      description: `Migrated from legacy variable cost (${item.driverType})`,
      sourcingModel: 'in-house',
      componentUnitLabel: getDriverUnitLabel(item.driverType),
      costPerComponentUnit: Math.max(0, item.rate),
      componentUnitsPerOutput: unitsPerOutput,
      orderQuantity: 0,
      orderFee: 0,
    };
  });
}

function isSourcingModel(value: unknown): value is VariableCostComponent['sourcingModel'] {
  return value === 'in-house' || value === 'purchase-order' || value === 'on-demand';
}

function ensureVariableComponent(
  raw: Record<string, unknown>,
  index: number,
): VariableCostComponent {
  return {
    id:
      typeof raw.id === 'string' && raw.id.length > 0
        ? raw.id
        : `var-${index + 1}`,
    name:
      typeof raw.name === 'string'
        ? raw.name
        : '',
    offeringId:
      typeof raw.offeringId === 'string' && raw.offeringId.length > 0
        ? raw.offeringId
        : undefined,
    description:
      typeof raw.description === 'string' && raw.description.length > 0
        ? raw.description
        : undefined,
    supplier:
      typeof raw.supplier === 'string' && raw.supplier.length > 0
        ? raw.supplier
        : undefined,
    sourcingModel: isSourcingModel(raw.sourcingModel)
      ? raw.sourcingModel
      : 'in-house',
    componentUnitLabel:
      typeof raw.componentUnitLabel === 'string'
        ? raw.componentUnitLabel
        : 'unit',
    costPerComponentUnit:
      typeof raw.costPerComponentUnit === 'number'
        ? raw.costPerComponentUnit
        : 0,
    componentUnitsPerOutput:
      typeof raw.componentUnitsPerOutput === 'number'
        ? raw.componentUnitsPerOutput
        : 0,
    orderQuantity:
      typeof raw.orderQuantity === 'number'
        ? raw.orderQuantity
        : 0,
    orderFee:
      typeof raw.orderFee === 'number'
        ? raw.orderFee
        : 0,
  };
}

/** Ensure a capacity item has all required fields. */
function ensureCapacityItem(
  raw: Record<string, unknown>,
  index: number,
): CapacityItem {
  return {
    id:
      typeof raw.id === 'string' && raw.id.length > 0
        ? raw.id
        : `cap-${index + 1}`,
    name: typeof raw.name === 'string' ? raw.name : '',
    offeringId:
      typeof raw.offeringId === 'string' && raw.offeringId.length > 0
        ? raw.offeringId
        : undefined,
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
 * Migrate the old single-capacity v2 shape (`capacity: {...}`) into
 * the new multi-capacity shape (`capacityItems: [...]`).
 */
function migrateSingleCapacityToItems(raw: Record<string, unknown>): CapacityItem[] {
  return [
    ensureCapacityItem(
      {
        ...raw,
        id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : 'cap-primary',
        name:
          typeof raw.name === 'string' && raw.name.length > 0
            ? raw.name
            : 'Primary Capacity',
      },
      0,
    ),
  ];
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
    return { ...defaultOperations, capacityItems: [], variableComponents: [] };
  }

  const data = raw as Record<string, unknown>;
  // Case 1: Legacy format — crew array exists
  if (Array.isArray(data.crew)) {
    const legacy = data as unknown as LegacyOperations;
    const workforce = migrateCrewToWorkforce(legacy.crew ?? []);

    const capacityItems = legacy.capacity
      ? migrateCapacity(legacy.capacity)
      : [];

    const monthlyBookings = capacityItems.reduce(
      (sum, item) => sum + item.maxOutputPerMonth,
      0,
    );
    const migratedCostItems = legacy.costBreakdown
      ? migrateCostBreakdown(legacy.costBreakdown, monthlyBookings)
      : [];
    const variableComponents = migrateVariableCostItemsToComponents(
      migratedCostItems.filter((item) => item.type === 'variable'),
      monthlyBookings,
    );
    const costItems = migratedCostItems.filter((item) => item.type === 'fixed');

    const equipment = Array.isArray(legacy.equipment)
      ? legacy.equipment
      : [];

    const safetyProtocols = Array.isArray(legacy.safetyProtocols)
      ? legacy.safetyProtocols
      : [];

    return {
      workforce,
      capacityItems,
      variableComponents,
      costItems,
      equipment,
      safetyProtocols,
      operationalMetrics: [],
    };
  }

  // Case 2: Current format (or mixed transitional shape)
  const hasCurrentShape =
    Array.isArray(data.workforce) ||
    Array.isArray(data.costItems) ||
    Array.isArray(data.variableComponents) ||
    Array.isArray(data.capacityItems) ||
    (data.capacity && typeof data.capacity === 'object');

  if (hasCurrentShape) {
    const workforce = Array.isArray(data.workforce)
      ? (data.workforce as WorkforceMember[]).map((w) => ({
          role: w.role ?? '',
          count: typeof w.count === 'number' ? w.count : 0,
          ratePerHour: typeof w.ratePerHour === 'number' ? w.ratePerHour : 0,
          hoursPerWeek:
            typeof w.hoursPerWeek === 'number'
              ? w.hoursPerWeek
              : DEFAULT_HOURS_PER_WEEK,
        }))
      : [];

    let capacityItems = Array.isArray(data.capacityItems)
      ? (data.capacityItems as unknown[])
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map((item, index) => ensureCapacityItem(item, index))
      : [];

    // Transitional migration: old single-capacity shape from previous generic version.
    if (
      capacityItems.length === 0 &&
      data.capacity &&
      typeof data.capacity === 'object'
    ) {
      capacityItems = migrateSingleCapacityToItems(
        data.capacity as Record<string, unknown>,
      );
    }

    const rawCostItems = Array.isArray(data.costItems)
      ? (data.costItems as CostItem[])
      : [];
    const monthlyOutputBasis = capacityItems.reduce(
      (sum, item) => sum + Math.max(0, item.plannedOutputPerMonth),
      0,
    );

    let variableComponents = Array.isArray(data.variableComponents)
      ? (data.variableComponents as unknown[])
          .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
          .map((item, index) => ensureVariableComponent(item, index))
      : [];

    if (variableComponents.length === 0) {
      variableComponents = migrateVariableCostItemsToComponents(
        rawCostItems.filter((item) => item.type === 'variable'),
        monthlyOutputBasis,
      );
    }

    const costItems = rawCostItems.filter((item) => item.type === 'fixed');

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
      capacityItems,
      variableComponents,
      costItems,
      equipment,
      safetyProtocols,
      operationalMetrics,
    };
  }

  // Case 3: Unknown/empty shape — return default
  return { ...defaultOperations, capacityItems: [], variableComponents: [] };
}
