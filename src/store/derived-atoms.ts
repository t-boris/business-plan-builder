import { atom } from 'jotai';
import {
  priceTier1Atom,
  priceTier2Atom,
  priceTier3Atom,
  monthlyLeadsAtom,
  conversionRateAtom,
  monthlyAdBudgetMetaAtom,
  monthlyAdBudgetGoogleAtom,
  costPerUnitAtom,
} from './scenario-atoms.ts';
import { MONTHLY_FIXED_COSTS } from '@/lib/constants.ts';
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
  const avgCheck = (v.priceTier1 + v.priceTier2 + v.priceTier3) / 3;
  const monthlyRevenue = monthlyBookings * avgCheck;
  const totalMonthlyAdSpend = v.monthlyAdBudgetMeta + v.monthlyAdBudgetGoogle;
  const cacPerBooking = monthlyBookings === 0 ? 0 : totalMonthlyAdSpend / monthlyBookings;
  const eventCosts = v.costPerUnit * monthlyBookings;
  const monthlyCosts = totalMonthlyAdSpend + eventCosts + MONTHLY_FIXED_COSTS;
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

// avgCheck = weighted average of pricing tiers (equal distribution)
export const avgCheckAtom = atom(
  (get) =>
    (get(priceTier1Atom) + get(priceTier2Atom) + get(priceTier3Atom)) / 3
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

// monthlyCosts = adSpend + (costPerUnit * bookings) + fixedCosts
export const monthlyCostsAtom = atom((get) => {
  const bookings = get(monthlyBookingsAtom);
  const adSpend = get(totalMonthlyAdSpendAtom);
  const eventCosts = get(costPerUnitAtom) * bookings;
  return adSpend + eventCosts + MONTHLY_FIXED_COSTS;
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
