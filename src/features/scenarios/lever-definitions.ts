export interface LeverDefinition {
  id: string; // matches sectionDerivedScope key
  label: string;
  category: 'revenue' | 'costs' | 'operations';
  unit: 'currency' | 'percent' | 'count';
  min?: number;
  max?: number;
  step?: number;
}

export const LEVER_DEFINITIONS: LeverDefinition[] = [
  // Revenue
  { id: 'pricePerUnit', label: 'Price per Unit', category: 'revenue', unit: 'currency' },
  { id: 'monthlyBookings', label: 'Monthly Bookings', category: 'revenue', unit: 'count', min: 0, max: 1000 },
  { id: 'conversionRate', label: 'Conversion Rate', category: 'revenue', unit: 'percent', max: 1, step: 0.01 },
  { id: 'monthlyLeads', label: 'Monthly Leads', category: 'revenue', unit: 'count', min: 0 },
  // Costs
  { id: 'variableCostPerOutput', label: 'Variable Cost per Unit', category: 'costs', unit: 'currency' },
  { id: 'fixedMonthlyTotal', label: 'Monthly Fixed Costs', category: 'costs', unit: 'currency' },
  { id: 'workforceMonthlyTotal', label: 'Workforce Monthly Cost', category: 'costs', unit: 'currency' },
  { id: 'monthlyMarketingBudget', label: 'Marketing Budget', category: 'costs', unit: 'currency' },
  // Operations
  { id: 'totalPlannedOutputPerMonth', label: 'Planned Output / Month', category: 'operations', unit: 'count' },
];

export const LEVER_CATEGORIES = [
  { key: 'revenue' as const, label: 'Revenue' },
  { key: 'costs' as const, label: 'Costs' },
  { key: 'operations' as const, label: 'Operations' },
];

export const LEVER_MAP = new Map(LEVER_DEFINITIONS.map((l) => [l.id, l]));
