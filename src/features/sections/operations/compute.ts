import type { Operations, VariableComponentSourcing } from '@/types';

export interface VariableComponentMonthlyCost {
  componentId: string;
  componentName: string;
  offeringId?: string;
  sourcingModel: VariableComponentSourcing;
  supplier?: string;
  componentUnitLabel: string;
  outputBasisPerMonth: number;
  componentUnitsPerOutput: number;
  requiredComponentUnits: number;
  estimatedOrders: number;
  monthlyMaterialCost: number;
  monthlyOrderCost: number;
  monthlyTotal: number;
}

export interface VariableCostByOffering {
  offeringId?: string;
  outputPerMonth: number;
  monthlyVariableTotal: number;
}

export interface OperationsCostSummary {
  variableMonthlyTotal: number;
  fixedMonthlyTotal: number;
  monthlyOperationsTotal: number;
  variableCostPerOutput: number;
  workforceMonthlyTotal: number;
  variableComponentCosts: VariableComponentMonthlyCost[];
  variableCostByOffering: VariableCostByOffering[];
  totalPlannedOutputPerMonth: number;
  totalMaxOutputPerDay: number;
  totalMaxOutputPerWeek: number;
  totalMaxOutputPerMonth: number;
  weightedUtilizationRate: number;
  primaryOutputUnitLabel: string;
}

const WEEKS_PER_MONTH = 52 / 12;
const DAYS_PER_MONTH = 30;

function deriveMonthlyCapacityLimit(item: {
  maxOutputPerDay: number;
  maxOutputPerWeek: number;
  maxOutputPerMonth: number;
}): number {
  const constraints: number[] = [];
  const day = Math.max(0, item.maxOutputPerDay);
  const week = Math.max(0, item.maxOutputPerWeek);
  const month = Math.max(0, item.maxOutputPerMonth);

  if (month > 0) constraints.push(month);
  if (week > 0) constraints.push(week * WEEKS_PER_MONTH);
  if (day > 0) constraints.push(day * DAYS_PER_MONTH);

  if (constraints.length === 0) return 0;
  return Math.min(...constraints);
}

/**
 * Compute cost summaries from the generic Operations model.
 *
 * - Variable components: per-output usage * cost per component unit
 *   + optional per-order fee for purchase-order sourcing
 * - Fixed items: rate * driverQuantityPerMonth, normalized to monthly
 *   (quarterly ÷ 3, yearly ÷ 12)
 * - Workforce: ratePerHour * hoursPerWeek * count * (52/12) weeks/month
 * - variableCostPerOutput: variableMonthlyTotal / total planned output across capacity items.
 */
export function computeOperationsCosts(ops: Operations): OperationsCostSummary {
  const fixedItems = ops.costItems.filter((i) => i.type === 'fixed');

  const outputByOffering = new Map<string, number>();
  const totalPlannedOutputPerMonth = ops.capacityItems.reduce((sum, item) => {
    const planned = Math.max(0, item.plannedOutputPerMonth);
    if (planned > 0 && item.offeringId) {
      outputByOffering.set(
        item.offeringId,
        (outputByOffering.get(item.offeringId) ?? 0) + planned,
      );
    }
    return sum + planned;
  }, 0);

  const variableComponentCosts = ops.variableComponents.map((component) => {
    // If a component is linked to an offering that currently has no mapped
    // capacity output, fall back to total planned output instead of zero.
    // This keeps estimates usable even when offering links are temporarily out of sync.
    const linkedOutput = component.offeringId
      ? (outputByOffering.get(component.offeringId) ?? 0)
      : 0;
    const outputBasisPerMonth =
      component.offeringId && linkedOutput > 0
        ? linkedOutput
        : totalPlannedOutputPerMonth;
    const componentUnitsPerOutput = Math.max(0, component.componentUnitsPerOutput);
    const requiredComponentUnits = outputBasisPerMonth * componentUnitsPerOutput;
    const monthlyMaterialCost =
      requiredComponentUnits * Math.max(0, component.costPerComponentUnit);
    const hasOrderFlow =
      component.sourcingModel !== 'in-house' &&
      Math.max(0, component.orderQuantity) > 0;
    const orders = hasOrderFlow
      ? Math.ceil(requiredComponentUnits / Math.max(1, component.orderQuantity))
      : 0;
    const monthlyOrderCost = orders * Math.max(0, component.orderFee);
    return {
      componentId: component.id,
      componentName: component.name,
      offeringId: component.offeringId,
      sourcingModel: component.sourcingModel,
      supplier: component.supplier,
      componentUnitLabel: component.componentUnitLabel,
      outputBasisPerMonth,
      componentUnitsPerOutput,
      requiredComponentUnits,
      estimatedOrders: orders,
      monthlyMaterialCost,
      monthlyOrderCost,
      monthlyTotal: monthlyMaterialCost + monthlyOrderCost,
    };
  });

  const variableMonthlyTotal = variableComponentCosts.reduce(
    (sum, line) => sum + line.monthlyTotal,
    0,
  );

  const variableByOfferingMap = new Map<string, VariableCostByOffering>();
  for (const line of variableComponentCosts) {
    const key = line.offeringId ?? '__shared__';
    const existing = variableByOfferingMap.get(key);
    if (existing) {
      existing.monthlyVariableTotal += line.monthlyTotal;
      continue;
    }
    const linkedOutput = line.offeringId
      ? (outputByOffering.get(line.offeringId) ?? 0)
      : 0;
    const outputPerMonth =
      line.offeringId && linkedOutput > 0
        ? linkedOutput
        : totalPlannedOutputPerMonth;
    variableByOfferingMap.set(key, {
      offeringId: line.offeringId,
      outputPerMonth,
      monthlyVariableTotal: line.monthlyTotal,
    });
  }
  const variableCostByOffering = Array.from(variableByOfferingMap.values());

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
    (sum, w) => sum + w.ratePerHour * w.hoursPerWeek * w.count * WEEKS_PER_MONTH,
    0,
  );

  const monthlyOperationsTotal =
    variableMonthlyTotal + fixedMonthlyTotal + workforceMonthlyTotal;

  const totalMaxOutputPerDay = ops.capacityItems.reduce(
    (sum, item) => sum + Math.max(0, item.maxOutputPerDay),
    0,
  );
  const totalMaxOutputPerWeek = ops.capacityItems.reduce(
    (sum, item) => sum + Math.max(0, item.maxOutputPerWeek),
    0,
  );
  const totalMaxOutputPerMonth = ops.capacityItems.reduce((sum, item) => (
    sum + deriveMonthlyCapacityLimit(item)
  ), 0);
  const weightedUtilizationNumerator = ops.capacityItems.reduce(
    (sum, item) => sum + Math.max(0, item.utilizationRate) * Math.max(0, item.plannedOutputPerMonth),
    0,
  );
  const weightedUtilizationRate =
    totalPlannedOutputPerMonth > 0
      ? weightedUtilizationNumerator / totalPlannedOutputPerMonth
      : 0;
  const primaryOutputUnitLabel =
    ops.capacityItems.find((item) => item.outputUnitLabel.trim().length > 0)?.outputUnitLabel ?? 'unit';

  const variableCostPerOutput =
    totalPlannedOutputPerMonth > 0
      ? variableMonthlyTotal / totalPlannedOutputPerMonth
      : 0;

  return {
    variableMonthlyTotal,
    fixedMonthlyTotal,
    monthlyOperationsTotal,
    variableCostPerOutput,
    workforceMonthlyTotal,
    variableComponentCosts,
    variableCostByOffering,
    totalPlannedOutputPerMonth,
    totalMaxOutputPerDay,
    totalMaxOutputPerWeek,
    totalMaxOutputPerMonth,
    weightedUtilizationRate,
    primaryOutputUnitLabel,
  };
}
