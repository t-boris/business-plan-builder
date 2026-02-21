import type {
  Operations,
  CapacityItem,
  WorkforceMember,
  CostItem,
  GrowthEvent,
  MonthlyProjection,
  MonthlyCosts,
} from '@/types';
import { computeOperationsCosts } from '@/features/sections/operations/compute';

// --- Input / Output types ---

export interface GrowthComputeInput {
  operations: Operations;
  basePricePerUnit: number;
  baseBookings: number;
  baseMarketingBudget: number;
  seasonCoefficients: number[];
  horizonMonths: number;
  events: GrowthEvent[];
}

export interface MonthlySnapshot {
  month: number;
  label: string;
  workforce: WorkforceMember[];
  costItems: CostItem[];
  plannedOutput: number;
  pricePerUnit: number;
  bookings: number;
  marketingBudget: number;
  revenue: number;
  workforceCost: number;
  variableCost: number;
  fixedCost: number;
  totalCost: number;
  profit: number;
}

export interface GrowthComputeResult {
  months: MonthlySnapshot[];
  projections: MonthlyProjection[];
  summary: {
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    breakEvenMonth: number | null;
  };
}

// --- Computation ---

export function computeGrowthTimeline(input: GrowthComputeInput): GrowthComputeResult {
  const {
    operations,
    basePricePerUnit,
    baseBookings,
    baseMarketingBudget,
    seasonCoefficients,
    horizonMonths,
    events,
  } = input;

  // Filter to enabled events, sorted by month
  const activeEvents = events
    .filter((e) => e.enabled)
    .sort((a, b) => a.month - b.month);

  const baseWorkforce = operations.workforce;
  const baseCostItems = operations.costItems;
  const baseCapacityItems = operations.capacityItems;

  const snapshots: MonthlySnapshot[] = [];
  const projections: MonthlyProjection[] = [];
  let cumulativeProfit = 0;
  let breakEvenMonth: number | null = null;

  for (let m = 1; m <= horizonMonths; m++) {
    // Accumulate events up to this month (for ongoing types)
    const applicableEvents = activeEvents.filter((e) => e.month <= m);

    // Build effective state
    let effectiveWorkforce = [...baseWorkforce];
    let effectiveCostItems = [...baseCostItems];
    let effectiveCapacityItems: CapacityItem[] = baseCapacityItems.map((item) => ({ ...item }));
    let effectiveMarketingBudget = baseMarketingBudget;
    let effectivePricePerUnit = basePricePerUnit;

    // Additive accumulators for custom deltas
    let customRevenueDelta = 0;
    let customFixedCostDelta = 0;
    let customVariableCostDelta = 0;
    let customMarketingDelta = 0;

    // Standalone capacity delta for when no capacity items exist
    let standaloneCapacityDelta = 0;

    // One-time accumulators (reset each month)
    let oneTimeNonOperatingCashFlow = 0;
    let oneTimeFixedCost = 0;

    for (const event of applicableEvents) {
      const { delta } = event;
      switch (delta.type) {
        case 'hire': {
          effectiveWorkforce = [
            ...effectiveWorkforce,
            {
              role: delta.data.role,
              count: delta.data.count,
              ratePerHour: delta.data.ratePerHour,
              hoursPerWeek: delta.data.hoursPerWeek,
            },
          ];
          // If hire specifies capacity contribution, increase output
          const hireCapacity = (delta.data.capacityPerHire ?? 0) * delta.data.count;
          if (hireCapacity > 0) {
            if (effectiveCapacityItems.length > 0) {
              effectiveCapacityItems = effectiveCapacityItems.map((item, i) =>
                i === 0
                  ? { ...item, plannedOutputPerMonth: item.plannedOutputPerMonth + hireCapacity }
                  : item,
              );
            } else {
              standaloneCapacityDelta += hireCapacity;
            }
          }
          break;
        }
        case 'cost-change':
          effectiveCostItems = [
            ...effectiveCostItems,
            {
              category: delta.data.category,
              type: delta.data.costType,
              rate: delta.data.rate,
              driverType: delta.data.driverType,
              driverQuantityPerMonth: delta.data.driverQuantityPerMonth,
            },
          ];
          break;
        case 'capacity-change': {
          const { capacityItemId, outputDelta } = delta.data;
          if (capacityItemId) {
            effectiveCapacityItems = effectiveCapacityItems.map((item) =>
              item.id === capacityItemId
                ? { ...item, plannedOutputPerMonth: item.plannedOutputPerMonth + outputDelta }
                : item,
            );
          } else if (effectiveCapacityItems.length > 0) {
            effectiveCapacityItems = effectiveCapacityItems.map((item) => ({
              ...item,
              plannedOutputPerMonth: item.plannedOutputPerMonth + outputDelta,
            }));
          } else {
            // No capacity items exist — track as standalone delta
            standaloneCapacityDelta += outputDelta;
          }
          break;
        }
        case 'marketing-change':
          effectiveMarketingBudget = delta.data.monthlyBudget;
          break;
        case 'custom':
          switch (delta.data.target) {
            case 'revenue':
              customRevenueDelta += delta.data.value;
              break;
            case 'fixedCost':
              customFixedCostDelta += delta.data.value;
              break;
            case 'variableCost':
              customVariableCostDelta += delta.data.value;
              break;
            case 'marketing':
              customMarketingDelta += delta.data.value;
              break;
          }
          break;

        // --- Pattern A: One-time effect (event.month === m only) ---
        case 'funding-round':
          if (event.month === m) {
            oneTimeNonOperatingCashFlow += delta.data.amount;
            oneTimeFixedCost += delta.data.legalCosts;
          }
          break;

        case 'equipment-purchase': {
          // One-time purchase cost only in event month
          if (event.month === m) {
            oneTimeFixedCost += delta.data.purchaseCost;
          }
          // Ongoing from event.month: maintenance + capacity
          const { capacityItemId: eqCapId, capacityIncrease } = delta.data;
          customFixedCostDelta += delta.data.maintenanceCostMonthly;
          if (eqCapId) {
            effectiveCapacityItems = effectiveCapacityItems.map((item) =>
              item.id === eqCapId
                ? { ...item, plannedOutputPerMonth: item.plannedOutputPerMonth + capacityIncrease }
                : item,
            );
          } else {
            effectiveCapacityItems = effectiveCapacityItems.map((item) => ({
              ...item,
              plannedOutputPerMonth: item.plannedOutputPerMonth + capacityIncrease,
            }));
          }
          break;
        }

        // --- Pattern B: Duration event (active during build, effects after) ---
        case 'facility-build': {
          const fbDuration = event.durationMonths || 1;
          const fbStart = event.month;
          const fbEnd = fbStart + fbDuration - 1;
          const fbCompleted = fbEnd + 1;
          const { capacityItemId: fbCapId } = delta.data;

          if (m >= fbStart && m <= fbEnd) {
            // During build: spread construction cost
            customFixedCostDelta += delta.data.constructionCost / fbDuration;
          }
          if (m >= fbCompleted) {
            // After completion: rent + capacity
            customFixedCostDelta += delta.data.monthlyRent;
            if (fbCapId) {
              effectiveCapacityItems = effectiveCapacityItems.map((item) =>
                item.id === fbCapId
                  ? { ...item, plannedOutputPerMonth: item.plannedOutputPerMonth + delta.data.capacityAdded }
                  : item,
              );
            } else {
              effectiveCapacityItems = effectiveCapacityItems.map((item) => ({
                ...item,
                plannedOutputPerMonth: item.plannedOutputPerMonth + delta.data.capacityAdded,
              }));
            }
          }
          break;
        }

        case 'hiring-campaign': {
          const hcDuration = event.durationMonths || 1;
          const hcStart = event.month;
          const hcEnd = hcStart + hcDuration - 1;
          const { totalHires } = delta.data;

          // Calculate cumulative hires up to this month and previous month
          let cumulativeHires: number;
          let prevCumulativeHires: number;

          if (m > hcEnd) {
            // After completion: all hires active
            cumulativeHires = totalHires;
            prevCumulativeHires = totalHires;
          } else if (m >= hcStart) {
            // During campaign: stagger hires
            const monthIndex = m - hcStart;
            cumulativeHires = Math.min(totalHires, Math.floor(totalHires * (monthIndex + 1) / hcDuration));
            const prevMonthIndex = monthIndex - 1;
            prevCumulativeHires = prevMonthIndex >= 0
              ? Math.min(totalHires, Math.floor(totalHires * (prevMonthIndex + 1) / hcDuration))
              : 0;
          } else {
            cumulativeHires = 0;
            prevCumulativeHires = 0;
          }

          // Add workforce members for cumulative hires
          if (cumulativeHires > 0) {
            effectiveWorkforce = [
              ...effectiveWorkforce,
              {
                role: delta.data.role,
                count: cumulativeHires,
                ratePerHour: delta.data.ratePerHour,
                hoursPerWeek: delta.data.hoursPerWeek,
              },
            ];
          }

          // One-time recruiting cost for new hires this month
          const newHiresThisMonth = cumulativeHires - prevCumulativeHires;
          if (newHiresThisMonth > 0) {
            oneTimeFixedCost += newHiresThisMonth * delta.data.recruitingCostPerHire;
          }

          // If campaign specifies capacity contribution, increase output
          const campaignCapacity = (delta.data.capacityPerHire ?? 0) * cumulativeHires;
          if (campaignCapacity > 0) {
            if (effectiveCapacityItems.length > 0) {
              effectiveCapacityItems = effectiveCapacityItems.map((item, i) =>
                i === 0
                  ? { ...item, plannedOutputPerMonth: item.plannedOutputPerMonth + campaignCapacity }
                  : item,
              );
            } else {
              standaloneCapacityDelta += campaignCapacity;
            }
          }
          break;
        }

        // --- Pattern C: Temporary effect (active during duration, reverts after) ---
        case 'seasonal-campaign': {
          const scDuration = event.durationMonths || 1;
          const scStart = event.month;
          const scEnd = scStart + scDuration - 1;

          if (m >= scStart && m <= scEnd) {
            customMarketingDelta += delta.data.budgetIncrease;
          }
          break;
        }

        // --- Pattern D: Instant ongoing (from event.month forever) ---
        case 'price-change':
          effectivePricePerUnit = delta.data.newPricePerUnit ?? delta.data.newAvgCheck ?? effectivePricePerUnit;
          break;
      }
    }

    // Derive total planned output from effective capacity items + standalone delta
    const effectivePlannedOutput = effectiveCapacityItems.reduce(
      (sum, item) => sum + Math.max(0, item.plannedOutputPerMonth),
      0,
    ) + Math.max(0, standaloneCapacityDelta);

    // Compute weighted average utilization rate across capacity items
    const weightedUtilNum = effectiveCapacityItems.reduce(
      (sum, item) => sum + Math.max(0, item.utilizationRate) * Math.max(0, item.plannedOutputPerMonth), 0,
    );
    const weightedUtilDenom = effectiveCapacityItems.reduce(
      (sum, item) => sum + Math.max(0, item.plannedOutputPerMonth), 0,
    );
    // Default to 100% if no utilization rates are set (backward compatible)
    const avgUtilization = weightedUtilDenom > 0 && weightedUtilNum > 0
      ? weightedUtilNum / weightedUtilDenom / 100  // stored as 0-100, convert to 0-1
      : 1;

    const effectiveBookings = effectivePlannedOutput > 0
      ? effectivePlannedOutput * avgUtilization
      : baseBookings * avgUtilization;

    // Apply seasonality (cycle for horizons > 12)
    const seasonCoeff = seasonCoefficients[(m - 1) % seasonCoefficients.length] ?? 1;

    // Compute revenue
    const seasonalBookings = Math.max(0, effectiveBookings) * seasonCoeff;
    const revenue = seasonalBookings * effectivePricePerUnit + customRevenueDelta;

    // Compute costs via operations engine on the effective state
    const effectiveOps: Operations = {
      ...operations,
      workforce: effectiveWorkforce,
      costItems: effectiveCostItems,
      capacityItems: effectiveCapacityItems,
    };
    const opsCosts = computeOperationsCosts(effectiveOps);

    const workforceCost = opsCosts.workforceMonthlyTotal;
    const variableCost = opsCosts.variableMonthlyTotal + customVariableCostDelta;
    const fixedCost = opsCosts.fixedMonthlyTotal + customFixedCostDelta + oneTimeFixedCost;
    const marketingCost = effectiveMarketingBudget + customMarketingDelta;
    const totalCost = workforceCost + variableCost + fixedCost + marketingCost;
    const profit = revenue - totalCost;

    cumulativeProfit += profit;
    if (breakEvenMonth === null && cumulativeProfit >= 0) {
      breakEvenMonth = m;
    }

    const snapshot: MonthlySnapshot = {
      month: m,
      label: `Month ${m}`,
      workforce: effectiveWorkforce,
      costItems: effectiveCostItems,
      plannedOutput: Math.max(0, effectivePlannedOutput),
      pricePerUnit: effectivePricePerUnit,
      bookings: Math.max(0, effectiveBookings),
      marketingBudget: effectiveMarketingBudget,
      revenue,
      workforceCost,
      variableCost,
      fixedCost,
      totalCost,
      profit,
    };
    snapshots.push(snapshot);

    // Map to MonthlyProjection format for Financial Projections compatibility
    const monthlyCosts: MonthlyCosts = {
      marketing: marketingCost,
      labor: workforceCost,
      supplies: variableCost,
      museum: 0,
      transport: 0,
      fixed: fixedCost,
    };
    projections.push({
      month: `Month ${m}`,
      revenue,
      costs: monthlyCosts,
      profit,
      nonOperatingCashFlow: oneTimeNonOperatingCashFlow,
    });
  }

  const totalRevenue = snapshots.reduce((s, snap) => s + snap.revenue, 0);
  const totalCosts = snapshots.reduce((s, snap) => s + snap.totalCost, 0);

  return {
    months: snapshots,
    projections,
    summary: {
      totalRevenue,
      totalCosts,
      totalProfit: totalRevenue - totalCosts,
      breakEvenMonth,
    },
  };
}
