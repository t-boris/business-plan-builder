import type { MonthlyCosts, MonthlyProjection } from '@/types';

function safe(value: number | undefined): number {
  return Number.isFinite(value) ? (value as number) : 0;
}

export function sumMonthlyCosts(costs: MonthlyCosts): number {
  return (
    safe(costs.marketing) +
    safe(costs.labor) +
    safe(costs.supplies) +
    safe(costs.museum) +
    safe(costs.transport) +
    safe(costs.fixed)
  );
}

export interface CashProjectionPoint {
  month: string;
  netCashFlow: number;
  endingCash: number;
}

export function buildCashProjection(
  months: MonthlyProjection[],
  startingCash: number,
): CashProjectionPoint[] {
  let runningCash = safe(startingCash);

  return months.map((month) => {
    const netCashFlow =
      safe(month.revenue) -
      sumMonthlyCosts(month.costs) +
      safe(month.nonOperatingCashFlow);
    runningCash += netCashFlow;
    return {
      month: month.month,
      netCashFlow,
      endingCash: runningCash,
    };
  });
}
