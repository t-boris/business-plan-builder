import type { DynamicScenario } from '@/types';

export interface ScenarioMetrics {
  monthlyRevenue: number;
  monthlyVariableCosts: number;
  monthlyFixedCosts: number;
  monthlyWorkforceCost: number;
  monthlyMarketingCost: number;
  monthlyTotalCosts: number;
  monthlyProfit: number;
  profitMargin: number;
  grossMargin: number;
  breakEvenUnits: number;
  annualRevenue: number;
  annualProfit: number;
  monthlyProjections: { month: string; revenue: number; costs: number; profit: number }[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_SEASON_COEFFICIENTS = Array(12).fill(1) as number[];

export function computeScenarioMetrics(
  sectionScope: Record<string, number>,
  overrides: Record<string, number>,
  seasonCoefficients?: number[],
): ScenarioMetrics {
  const s = { ...sectionScope, ...overrides };
  const coeffs = seasonCoefficients?.length === 12 ? seasonCoefficients : DEFAULT_SEASON_COEFFICIENTS;

  // Extract base values
  const leads = s.monthlyLeads ?? 0;
  const conversionRate = s.conversionRate ?? 0;
  const plannedOutput = s.totalPlannedOutputPerMonth ?? 0;
  const directBookings = s.monthlyBookings ?? 0;

  // Derive bookings: explicit override wins, then leads*conversion, then capacity, then direct
  const bookings = ('monthlyBookings' in overrides)
    ? overrides.monthlyBookings
    : (leads > 0 && conversionRate > 0)
      ? leads * conversionRate
      : (plannedOutput > 0 ? plannedOutput : directBookings);

  const price = s.pricePerUnit ?? 0;
  const variableCostPerUnit = s.variableCostPerOutput ?? s.variableCostPerUnit ?? 0;
  const fixedCosts = s.fixedMonthlyTotal ?? s.monthlyFixedCosts ?? 0;
  const workforceCost = s.workforceMonthlyTotal ?? s.monthlyLaborCost ?? 0;
  const marketingCost = s.monthlyMarketingBudget ?? 0;

  // Monthly calculations
  const monthlyRevenue = bookings * price;
  const monthlyVariableCosts = bookings * variableCostPerUnit;
  const monthlyFixedCosts = fixedCosts;
  const monthlyWorkforceCost = workforceCost;
  const monthlyMarketingCost = marketingCost;
  const monthlyTotalCosts = monthlyVariableCosts + monthlyFixedCosts + monthlyWorkforceCost + monthlyMarketingCost;
  const monthlyProfit = monthlyRevenue - monthlyTotalCosts;

  // Margins
  const profitMargin = monthlyRevenue > 0 ? monthlyProfit / monthlyRevenue : 0;
  const grossMargin = monthlyRevenue > 0 ? (monthlyRevenue - monthlyVariableCosts) / monthlyRevenue : 0;

  // Break-even
  const contributionPerUnit = price - variableCostPerUnit;
  const totalFixedPerMonth = monthlyFixedCosts + monthlyWorkforceCost + monthlyMarketingCost;
  const breakEvenUnits = contributionPerUnit > 0 ? Math.ceil(totalFixedPerMonth / contributionPerUnit) : 0;

  // Annual
  const annualRevenue = monthlyRevenue * 12;
  const annualProfit = monthlyProfit * 12;

  // 12-month projections with seasonality
  const monthlyProjections = MONTH_NAMES.map((month, i) => {
    const coeff = coeffs[i];
    const rev = monthlyRevenue * coeff;
    const varCosts = monthlyVariableCosts * coeff;
    const costs = varCosts + monthlyFixedCosts + monthlyWorkforceCost + monthlyMarketingCost;
    return { month, revenue: rev, costs, profit: rev - costs };
  });

  return {
    monthlyRevenue,
    monthlyVariableCosts,
    monthlyFixedCosts,
    monthlyWorkforceCost,
    monthlyMarketingCost,
    monthlyTotalCosts,
    monthlyProfit,
    profitMargin,
    grossMargin,
    breakEvenUnits,
    annualRevenue,
    annualProfit,
    monthlyProjections,
  };
}

export function evaluateScenarioFromFirestore(
  scenario: DynamicScenario,
  sectionScope: Record<string, number>,
  seasonCoefficients?: number[],
): ScenarioMetrics {
  return computeScenarioMetrics(sectionScope, scenario.values, seasonCoefficients);
}
