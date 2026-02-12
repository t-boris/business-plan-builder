// Scenario Types for What-If Engine
// All interfaces are serializable (no methods) for Firestore compatibility.

export interface ScenarioVariables {
  // Pricing tiers
  priceTier1: number;
  priceTier2: number;
  priceTier3: number;

  // Lead & conversion
  monthlyLeads: number;
  conversionRate: number;
  cacPerLead: number;

  // Marketing budgets (per channel)
  monthlyAdBudgetMeta: number;
  monthlyAdBudgetGoogle: number;

  // Operations
  staffCount: number;
  costPerUnit: number;
  bookingsPerMonth: number;
}

export interface ScenarioMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  isBaseline: boolean;
}

export interface Scenario {
  metadata: ScenarioMetadata;
  variables: ScenarioVariables;
}

export interface DerivedMetrics {
  monthlyBookings: number;
  monthlyRevenue: number;
  monthlyCosts: number;
  monthlyProfit: number;
  avgCheck: number;
  cacPerBooking: number;
  breakEvenMonths: number;
  annualRevenue: number;
  annualProfit: number;
}

// Dynamic scenario for Phase 7 generic scenario engine
export interface DynamicScenario {
  metadata: ScenarioMetadata;
  values: Record<string, number>; // only input variable values, keyed by variable ID
}
