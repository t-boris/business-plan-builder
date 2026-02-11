import { atom } from 'jotai';
import {
  priceStarterAtom,
  priceExplorerAtom,
  priceVIPAtom,
  monthlyLeadsAtom,
  conversionRateAtom,
  monthlyAdBudgetMetaAtom,
  monthlyAdBudgetGoogleAtom,
  crewCountAtom,
  costPerEventAtom,
} from './scenario-atoms.ts';
import { CREW_HOURLY_RATE, AVG_HOURS_PER_EVENT } from '@/lib/constants.ts';
import type { ScenarioVariables } from '@/types';

// ---- Pure function for computing derived metrics (used in comparison view) ----

export interface ComputedMetrics {
  monthlyBookings: number;
  avgCheck: number;
  monthlyRevenue: number;
  totalMonthlyAdSpend: number;
  cacPerBooking: number;
  monthlyCosts: number;
  monthlyProfit: number;
  annualRevenue: number;
  annualProfit: number;
  profitMargin: number;
}

/** Compute all derived metrics from scenario variables (pure function, no atoms). */
export function computeDerivedMetrics(v: ScenarioVariables): ComputedMetrics {
  const monthlyBookings = Math.round(v.monthlyLeads * v.conversionRate);
  const avgCheck = (v.priceStarter + v.priceExplorer + v.priceVIP) / 3;
  const monthlyRevenue = monthlyBookings * avgCheck;
  const totalMonthlyAdSpend = v.monthlyAdBudgetMeta + v.monthlyAdBudgetGoogle;
  const cacPerBooking = monthlyBookings === 0 ? 0 : totalMonthlyAdSpend / monthlyBookings;
  const laborCost = v.crewCount * CREW_HOURLY_RATE * AVG_HOURS_PER_EVENT * monthlyBookings;
  const eventCosts = v.costPerEvent * monthlyBookings;
  const monthlyCosts = laborCost + totalMonthlyAdSpend + eventCosts;
  const monthlyProfit = monthlyRevenue - monthlyCosts;
  const annualRevenue = monthlyRevenue * 12;
  const annualProfit = monthlyProfit * 12;
  const profitMargin = monthlyRevenue === 0 ? 0 : monthlyProfit / monthlyRevenue;

  return {
    monthlyBookings,
    avgCheck,
    monthlyRevenue,
    totalMonthlyAdSpend,
    cacPerBooking,
    monthlyCosts,
    monthlyProfit,
    annualRevenue,
    annualProfit,
    profitMargin,
  };
}

// monthlyBookings = monthlyLeads * conversionRate
export const monthlyBookingsAtom = atom((get) =>
  Math.round(get(monthlyLeadsAtom) * get(conversionRateAtom))
);

// avgCheck = weighted average of package prices (equal distribution)
export const avgCheckAtom = atom(
  (get) =>
    (get(priceStarterAtom) + get(priceExplorerAtom) + get(priceVIPAtom)) / 3
);

// monthlyRevenue = monthlyBookings * avgCheck
export const monthlyRevenueAtom = atom(
  (get) => get(monthlyBookingsAtom) * get(avgCheckAtom)
);

// totalMonthlyAdSpend = sum of all channel budgets
export const totalMonthlyAdSpendAtom = atom(
  (get) => get(monthlyAdBudgetMetaAtom) + get(monthlyAdBudgetGoogleAtom)
);

// cacPerBooking = totalMonthlyAdSpend / monthlyBookings
export const cacPerBookingAtom = atom((get) => {
  const bookings = get(monthlyBookingsAtom);
  if (bookings === 0) return 0;
  return get(totalMonthlyAdSpendAtom) / bookings;
});

// monthlyCosts = (crewCount * hourlyRate * avgHoursPerEvent * monthlyBookings) + totalMonthlyAdSpend + (costPerEvent * monthlyBookings)
export const monthlyCostsAtom = atom((get) => {
  const bookings = get(monthlyBookingsAtom);
  const laborCost =
    get(crewCountAtom) * CREW_HOURLY_RATE * AVG_HOURS_PER_EVENT * bookings;
  const adSpend = get(totalMonthlyAdSpendAtom);
  const eventCosts = get(costPerEventAtom) * bookings;
  return laborCost + adSpend + eventCosts;
});

// monthlyProfit = monthlyRevenue - monthlyCosts
export const monthlyProfitAtom = atom(
  (get) => get(monthlyRevenueAtom) - get(monthlyCostsAtom)
);

// annualRevenue = monthlyRevenue * 12
export const annualRevenueAtom = atom((get) => get(monthlyRevenueAtom) * 12);

// annualProfit = monthlyProfit * 12
export const annualProfitAtom = atom((get) => get(monthlyProfitAtom) * 12);

// profitMargin = monthlyProfit / monthlyRevenue
export const profitMarginAtom = atom((get) => {
  const revenue = get(monthlyRevenueAtom);
  if (revenue === 0) return 0;
  return get(monthlyProfitAtom) / revenue;
});
