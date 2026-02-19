import type { AdoptionModel } from '@/types';

export interface AdoptionDataPoint {
  month: number;
  customers: number;
}

/**
 * Compute adoption projection over N months.
 * S-curve uses logistic: N(t) = K / (1 + ((K - N0) / N0) * e^(-r*t))
 * Linear: N(t) = N0 + rate * t (capped at totalMarket)
 */
export function computeAdoption(model: AdoptionModel): AdoptionDataPoint[] {
  const { type, totalMarket, initialUsers, growthRate, projectionMonths } = model;
  const K = totalMarket;
  const N0 = Math.max(initialUsers, 1);
  const r = growthRate;
  const months = Math.max(projectionMonths, 1);
  const points: AdoptionDataPoint[] = [];

  for (let t = 0; t <= months; t++) {
    let customers: number;
    if (type === 's-curve') {
      customers = K / (1 + ((K - N0) / N0) * Math.exp(-r * t));
    } else {
      customers = Math.min(N0 + r * t, K);
    }
    points.push({ month: t, customers: Math.round(customers) });
  }

  return points;
}
