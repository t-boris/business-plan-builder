import type { Operations } from '@/types';

export interface OperationsCostSummary {
  variableMonthlyTotal: number;
  fixedMonthlyTotal: number;
  monthlyOperationsTotal: number;
  variableCostPerOutput: number;
  workforceMonthlyTotal: number;
}

/**
 * Compute cost summaries from the generic Operations model.
 *
 * - Variable items: rate * driverQuantityPerMonth
 * - Fixed items: rate * driverQuantityPerMonth, normalized to monthly
 *   (quarterly ÷ 3, yearly ÷ 12)
 * - Workforce: ratePerHour * count * 160 hours/month per worker
 * - variableCostPerOutput: variableMonthlyTotal / plannedOutputPerMonth
 */
export function computeOperationsCosts(ops: Operations): OperationsCostSummary {
  const variableItems = ops.costItems.filter((i) => i.type === 'variable');
  const fixedItems = ops.costItems.filter((i) => i.type === 'fixed');

  const variableMonthlyTotal = variableItems.reduce(
    (sum, item) => sum + item.rate * item.driverQuantityPerMonth,
    0,
  );

  const fixedMonthlyTotal = fixedItems.reduce((sum, item) => {
    // Normalize to monthly
    switch (item.driverType) {
      case 'quarterly':
        return sum + (item.rate * item.driverQuantityPerMonth) / 3;
      case 'yearly':
        return sum + (item.rate * item.driverQuantityPerMonth) / 12;
      default:
        return sum + item.rate * item.driverQuantityPerMonth;
    }
  }, 0);

  const workforceMonthlyTotal = ops.workforce.reduce(
    (sum, w) => sum + w.ratePerHour * w.count * 160,
    0,
  ); // ~160 hours/month per worker

  const monthlyOperationsTotal =
    variableMonthlyTotal + fixedMonthlyTotal + workforceMonthlyTotal;

  const variableCostPerOutput =
    ops.capacity.plannedOutputPerMonth > 0
      ? variableMonthlyTotal / ops.capacity.plannedOutputPerMonth
      : 0;

  return {
    variableMonthlyTotal,
    fixedMonthlyTotal,
    monthlyOperationsTotal,
    variableCostPerOutput,
    workforceMonthlyTotal,
  };
}
