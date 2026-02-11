// Scenario Types for What-If Engine
// All interfaces are serializable (no methods) for Firestore compatibility.

export interface ScenarioVariables {
  // Package pricing
  priceStarter: number;
  priceExplorer: number;
  priceVIP: number;

  // Lead & conversion
  monthlyLeads: number;
  conversionRate: number;
  cacPerLead: number;

  // Marketing budgets (per channel)
  monthlyAdBudgetMeta: number;
  monthlyAdBudgetGoogle: number;

  // Operations
  crewCount: number;
  costPerEvent: number;
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
