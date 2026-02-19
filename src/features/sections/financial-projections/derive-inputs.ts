import type {
  MarketingStrategy,
  Operations,
  ProductService,
} from '@/types';
import { normalizeOperations } from '@/features/sections/operations/normalize';
import { computeOperationsCosts } from '@/features/sections/operations/compute';
import { normalizeProductService } from '@/features/sections/product-service/normalize';

export interface DerivedFinancialInputs {
  baseOutputPerMonth: number;
  totalMaxOutputPerMonth: number;
  averagePricePerOutput: number;
  variableCostPerOutput: number;
  monthlyFixedOverhead: number;
  monthlyWorkforceCost: number;
  monthlyFixedCost: number;
  monthlyMarketing: number;
  hasCapacityOutput: boolean;
  hasPriceSignal: boolean;
}

function toPositive(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
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
 * Derive financial inputs from other sections:
 * - Capacity mix from Operations (base output + capacity ceiling)
 * - Price signal from Product/Service offerings linked by offeringId
 * - Variable + fixed/overhead costs from Operations
 * - Marketing budget from Marketing channels
 */
export function deriveFinancialInputsFromSections(
  rawProductService: ProductService,
  rawOperations: Operations,
  rawMarketing: MarketingStrategy,
): DerivedFinancialInputs {
  const productService = normalizeProductService(rawProductService);
  const operations = normalizeOperations(rawOperations);
  const opsSummary = computeOperationsCosts(operations);

  const priceByOfferingId = new Map<string, number>();
  let sumOfferingPrices = 0;
  let countOfferingPrices = 0;
  for (const offering of productService.offerings) {
    const price = toPositive(offering.price);
    if (price > 0) {
      priceByOfferingId.set(offering.id, price);
      sumOfferingPrices += price;
      countOfferingPrices += 1;
    }
  }
  const averageOfferingPrice =
    countOfferingPrices > 0 ? sumOfferingPrices / countOfferingPrices : 0;

  let linkedPricedOutput = 0;
  let linkedPricedRevenue = 0;
  for (const item of operations.capacityItems) {
    const planned = Math.max(0, item.plannedOutputPerMonth);
    const capLimit = deriveMonthlyCapacityLimit(item);
    const effectiveOutput = capLimit > 0 ? Math.min(planned, capLimit) : planned;
    if (effectiveOutput <= 0 || !item.offeringId) continue;
    const price = priceByOfferingId.get(item.offeringId) ?? 0;
    if (price > 0) {
      linkedPricedOutput += effectiveOutput;
      linkedPricedRevenue += effectiveOutput * price;
    }
  }
  const weightedLinkedPrice =
    linkedPricedOutput > 0 ? linkedPricedRevenue / linkedPricedOutput : 0;
  const fallbackPrice =
    weightedLinkedPrice > 0 ? weightedLinkedPrice : averageOfferingPrice;

  let baseOutputPerMonth = 0;
  let totalPriceWeightedRevenue = 0;
  for (const item of operations.capacityItems) {
    const planned = Math.max(0, item.plannedOutputPerMonth);
    const capLimit = deriveMonthlyCapacityLimit(item);
    const effectiveOutput = capLimit > 0 ? Math.min(planned, capLimit) : planned;
    if (effectiveOutput <= 0) continue;

    baseOutputPerMonth += effectiveOutput;

    const linkedPrice = item.offeringId
      ? (priceByOfferingId.get(item.offeringId) ?? 0)
      : 0;
    const price = linkedPrice > 0 ? linkedPrice : fallbackPrice;
    if (price > 0) {
      totalPriceWeightedRevenue += effectiveOutput * price;
    }
  }

  const averagePricePerOutput =
    baseOutputPerMonth > 0 ? totalPriceWeightedRevenue / baseOutputPerMonth : 0;

  const channels = Array.isArray(rawMarketing.channels)
    ? rawMarketing.channels
    : [];
  const monthlyMarketing = channels.reduce(
    (sum, channel) => sum + Math.max(0, channel.budget),
    0,
  );

  const monthlyWorkforceCost = opsSummary.workforceMonthlyTotal;
  const monthlyFixedCost = opsSummary.fixedMonthlyTotal;
  const monthlyFixedOverhead = monthlyWorkforceCost + monthlyFixedCost;

  return {
    baseOutputPerMonth,
    totalMaxOutputPerMonth: opsSummary.totalMaxOutputPerMonth,
    averagePricePerOutput,
    variableCostPerOutput: opsSummary.variableCostPerOutput,
    monthlyFixedOverhead,
    monthlyWorkforceCost,
    monthlyFixedCost,
    monthlyMarketing,
    hasCapacityOutput: baseOutputPerMonth > 0,
    hasPriceSignal: averagePricePerOutput > 0,
  };
}
