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
