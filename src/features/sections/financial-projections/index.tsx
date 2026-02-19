import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { useSection } from '@/hooks/use-section';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import type {
  FinancialProjections as FinancialProjectionsType,
  GrowthTimeline as GrowthTimelineType,
  KpisMetrics as KpisMetricsType,
  MonthlyProjection,
  MonthlyCosts,
  MarketingStrategy as MarketingStrategyType,
  Operations as OperationsType,
  ProductService as ProductServiceType,
} from '@/types';
import { scenarioHorizonAtom } from '@/store/scenario-atoms';
import { defaultGrowthTimeline } from '@/features/sections/growth-timeline/defaults';
import { computeGrowthTimeline } from '@/features/sections/growth-timeline/compute';
import type {
  GrowthComputeInput,
  GrowthComputeResult,
} from '@/features/sections/growth-timeline/compute';
import { normalizeProductService } from '@/features/sections/product-service/normalize';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RefreshCw, Info } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import { deriveFinancialInputsFromSections } from './derive-inputs';
import { buildCashProjection, sumMonthlyCosts } from './cash-flow';

const MONTH_NAMES = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];
const MONTH_LABELS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

// Seasonality presets
const SEASON_PRESET_FLAT: number[] = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
const SEASON_PRESET_SUMMER_PEAK: number[] = [0.60, 0.80, 1.00, 1.30, 1.50, 1.50, 1.10, 0.90, 0.70, 0.80, 0.50, 0.60];

function generateMonthsFromCoefficients(
  coefficients: number[],
  pricePerUnit: number,
  variableCostPerUnit: number,
  monthlyWorkforce: number,
  monthlyFixed: number,
  monthlyMarketing: number,
  baseBookings: number,
  maxOutputPerMonth?: number,
): MonthlyProjection[] {
  return MONTH_NAMES.map((month, i) => {
    const rawBookings = Math.round(Math.max(0, baseBookings) * coefficients[i]);
    const bookings =
      typeof maxOutputPerMonth === 'number' && maxOutputPerMonth > 0
        ? Math.min(rawBookings, Math.round(maxOutputPerMonth))
        : rawBookings;
    const revenue = bookings * pricePerUnit;
    const marketing = monthlyMarketing;
    const labor = monthlyWorkforce;
    const variableCost = variableCostPerUnit * bookings;
    const fixed = monthlyFixed;
    const totalCosts = marketing + labor + variableCost + fixed;
    return {
      month,
      revenue,
      costs: { marketing, labor, supplies: variableCost, museum: 0, transport: 0, fixed },
      profit: revenue - totalCosts,
    };
  });
}

const defaultFinancials: FinancialProjectionsType = {
  startingCash: 0,
  months: [],
  unitEconomics: {
    pricePerUnit: 0,
    variableCostPerUnit: 0,
    profitPerUnit: 0,
    breakEvenUnits: 0,
  },
  seasonCoefficients: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

const defaultProductService: ProductServiceType = {
  overview: '',
  offerings: [],
  addOns: [],
};

const defaultOperations: OperationsType = {
  workforce: [],
  capacityItems: [],
  variableComponents: [],
  costItems: [],
  equipment: [],
  safetyProtocols: [],
  operationalMetrics: [],
};

const defaultMarketingStrategy: MarketingStrategyType = {
  channels: [],
  offers: [],
  landingPage: {
    url: '',
    description: '',
  },
};

const defaultKpis: KpisMetricsType = {
  targets: {
    monthlyLeads: 0,
    conversionRate: 0,
    pricePerUnit: 0,
    cacPerLead: 0,
    cacPerBooking: 0,
    monthlyBookings: 0,
  },
};

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

function deriveBaseBookingsFromOperations(operations: OperationsType): number {
  return operations.capacityItems.reduce((sum, item) => {
    const planned = Math.max(0, item.plannedOutputPerMonth);
    const capLimit = deriveMonthlyCapacityLimit(item);
    const effective = capLimit > 0 ? Math.min(planned, capLimit) : planned;
    return sum + effective;
  }, 0);
}

function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function deriveUnitEconomicsFromGrowthMonths(
  months: GrowthComputeResult['months'],
  fallbackPricePerUnit: number,
  fallbackVariableCostPerUnit: number,
  fallbackMonthlyOverhead: number,
) {
  const safeFallbackPrice = Number.isFinite(fallbackPricePerUnit)
    ? fallbackPricePerUnit
    : 0;
  const safeFallbackVariable = Number.isFinite(fallbackVariableCostPerUnit)
    ? fallbackVariableCostPerUnit
    : 0;
  const safeFallbackOverhead = Number.isFinite(fallbackMonthlyOverhead)
    ? fallbackMonthlyOverhead
    : 0;

  const totalBookings = months.reduce(
    (sum, month) => sum + Math.max(0, month.bookings),
    0,
  );
  const totalRevenue = months.reduce(
    (sum, month) => sum + Math.max(0, month.revenue),
    0,
  );
  const totalVariableCost = months.reduce(
    (sum, month) => sum + Math.max(0, month.variableCost),
    0,
  );
  const averageMonthlyOverhead =
    months.length > 0
      ? months.reduce(
          (sum, month) =>
            sum +
            Math.max(0, month.marketingBudget) +
            Math.max(0, month.workforceCost) +
            Math.max(0, month.fixedCost),
          0,
        ) / months.length
      : safeFallbackOverhead;

  const pricePerUnit =
    totalBookings > 0 ? totalRevenue / totalBookings : safeFallbackPrice;
  const variableCostPerUnit =
    totalBookings > 0
      ? totalVariableCost / totalBookings
      : safeFallbackVariable;
  const profitPerUnit = pricePerUnit - variableCostPerUnit;
  const breakEvenUnits =
    profitPerUnit > 0
      ? Math.ceil(averageMonthlyOverhead / profitPerUnit)
      : 0;

  return {
    pricePerUnit: round2(pricePerUnit),
    variableCostPerUnit: round2(variableCostPerUnit),
    profitPerUnit: round2(profitPerUnit),
    breakEvenUnits,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function getVariableCosts(costs: MonthlyCosts): number {
  return (costs.supplies ?? 0) + (costs.museum ?? 0) + (costs.transport ?? 0);
}

function getFixedCosts(costs: MonthlyCosts): number {
  return (costs.labor ?? 0) + (costs.fixed ?? 0);
}

const PIE_COLORS = ['var(--chart-cost)', 'var(--chart-profit)', 'var(--chart-revenue)', 'var(--chart-accent-1)', 'var(--chart-accent-2)', '#06b6d4'];

export function FinancialProjections() {
  const { data, updateData, isLoading, canEdit } = useSection<FinancialProjectionsType>('financial-projections', defaultFinancials);
  const { data: productService, isLoading: isProductServiceLoading } = useSection<ProductServiceType>(
    'product-service',
    defaultProductService,
  );
  const { data: operations, isLoading: isOperationsLoading } = useSection<OperationsType>(
    'operations',
    defaultOperations,
  );
  const { data: marketingStrategy, isLoading: isMarketingLoading } = useSection<MarketingStrategyType>(
    'marketing-strategy',
    defaultMarketingStrategy,
  );
  const { data: kpis } = useSection<KpisMetricsType>('kpis-metrics', defaultKpis);
  const { data: growthData } = useSection<GrowthTimelineType>(
    'growth-timeline',
    defaultGrowthTimeline,
  );
  const horizonMonths = useAtomValue(scenarioHorizonAtom);
  const { businessId } = useParams<{ businessId: string }>();

  const isGrowthDriven =
    growthData.autoSync && growthData.events.filter((e) => e.enabled).length > 0;

  const unitEconomics = {
    pricePerUnit: data.unitEconomics?.pricePerUnit ?? 0,
    variableCostPerUnit: data.unitEconomics?.variableCostPerUnit ?? 0,
    profitPerUnit: data.unitEconomics?.profitPerUnit ?? 0,
    breakEvenUnits: data.unitEconomics?.breakEvenUnits ?? 0,
  };

  const seasonCoefficients =
    Array.isArray(data.seasonCoefficients) &&
    data.seasonCoefficients.length === 12
      ? data.seasonCoefficients.map((value) =>
          Number.isFinite(value) ? value : 1,
        )
      : SEASON_PRESET_FLAT;

  const rawMonths = Array.isArray(data.months) ? data.months : [];
  // Ensure fixed costs field exists (migration)
  const months = rawMonths.map((m) => ({
    ...m,
    costs: { ...m.costs, fixed: m.costs.fixed ?? 0 },
  }));
  const startingCash = Number.isFinite(data.startingCash) ? data.startingCash : 0;
  const cashProjection = buildCashProjection(months, startingCash);
  const endingCashBalance =
    cashProjection.length > 0
      ? cashProjection[cashProjection.length - 1].endingCash
      : startingCash;
  const minCashBalance =
    cashProjection.length > 0
      ? Math.min(startingCash, ...cashProjection.map((point) => point.endingCash))
      : startingCash;
  const firstNegativeCashMonthIndex = cashProjection.findIndex(
    (point) => point.endingCash < 0,
  );
  const firstNegativeCashMonthLabel =
    firstNegativeCashMonthIndex >= 0
      ? months[firstNegativeCashMonthIndex]?.month
      : null;

  const chartData = months.map((m, index) => ({
    month: m.month,
    Revenue: m.revenue,
    'Total Costs': sumMonthlyCosts(m.costs),
    Profit: m.revenue - sumMonthlyCosts(m.costs),
    'Cash Balance': cashProjection[index]?.endingCash ?? startingCash,
  }));

  // Aggregate totals
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalCosts = months.reduce((s, m) => s + sumMonthlyCosts(m.costs), 0);
  const totalProfit = totalRevenue - totalCosts;
  const totalMarketingCosts = months.reduce((s, m) => s + (m.costs.marketing ?? 0), 0);
  const totalVariableCosts = months.reduce((s, m) => s + getVariableCosts(m.costs), 0);
  const totalFixedCosts = months.reduce((s, m) => s + getFixedCosts(m.costs), 0);
  const totalNetCashFlow = cashProjection.reduce((s, point) => s + point.netCashFlow, 0);
  const avgMonthlyRevenue = months.length > 0 ? totalRevenue / months.length : 0;
  const avgMonthlyProfit = months.length > 0 ? totalProfit / months.length : 0;
  const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

  // Cost breakdown for pie chart (aggregate across all months)
  const aggCosts = months.reduce(
    (acc, m) => ({
      marketing: acc.marketing + m.costs.marketing,
      labor: acc.labor + m.costs.labor,
      supplies: acc.supplies + m.costs.supplies,
      museum: acc.museum + m.costs.museum,
      transport: acc.transport + m.costs.transport,
      fixed: acc.fixed + (m.costs.fixed || 0),
    }),
    { marketing: 0, labor: 0, supplies: 0, museum: 0, transport: 0, fixed: 0 },
  );

  const costPieData = [
    { name: 'Marketing', value: aggCosts.marketing },
    { name: 'Labor', value: aggCosts.labor },
    { name: 'Supplies', value: aggCosts.supplies },
    { name: 'Museum', value: aggCosts.museum },
    { name: 'Transport', value: aggCosts.transport },
    { name: 'Fixed Costs', value: aggCosts.fixed },
  ].filter((d) => d.value > 0);

  // Monthly profit bar data
  const profitBarData = months.map((m) => ({
    month: m.month.split(' ')[0],
    Profit: m.revenue - sumMonthlyCosts(m.costs),
  }));

  const cashBalanceData = cashProjection.map((point) => ({
    month: point.month,
    'Ending Cash': point.endingCash,
    'Net Cash Flow': point.netCashFlow,
  }));

  const derived = useMemo(
    () =>
      deriveFinancialInputsFromSections(
        productService,
        operations,
        marketingStrategy,
      ),
    [marketingStrategy, operations, productService],
  );
  const normalizedProductService = useMemo(
    () => normalizeProductService(productService),
    [productService],
  );
  const baseBookingsFromOperations = useMemo(
    () => deriveBaseBookingsFromOperations(operations),
    [operations],
  );
  const pricePerUnitFromOfferings = useMemo(() => {
    const prices = normalizedProductService.offerings
      .map((offering) => offering.price)
      .filter((price): price is number => price !== null && price > 0);
    if (prices.length === 0) return 0;
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }, [normalizedProductService.offerings]);

  const growthComputeInput: GrowthComputeInput = useMemo(() => {
    const legacyFinancialPrice = (data.unitEconomics as { avgCheck?: number } | undefined)?.avgCheck;
    const legacyKpiPrice = (kpis.targets as { avgCheck?: number } | undefined)?.avgCheck;
    const baseMarketingBudget = marketingStrategy.channels.reduce(
      (sum, channel) => sum + (channel.budget || 0),
      0,
    );
    return {
      operations,
      basePricePerUnit:
        unitEconomics.pricePerUnit ||
        legacyFinancialPrice ||
        kpis.targets.pricePerUnit ||
        legacyKpiPrice ||
        pricePerUnitFromOfferings ||
        0,
      baseBookings:
        baseBookingsFromOperations > 0
          ? baseBookingsFromOperations
          : (kpis.targets.monthlyBookings || 0),
      baseMarketingBudget,
      seasonCoefficients,
      horizonMonths,
      events: growthData.events,
    };
  }, [
    operations,
    data.unitEconomics,
    unitEconomics.pricePerUnit,
    kpis.targets,
    pricePerUnitFromOfferings,
    baseBookingsFromOperations,
    marketingStrategy.channels,
    seasonCoefficients,
    horizonMonths,
    growthData.events,
  ]);
  const growthComputed = useMemo(
    () => computeGrowthTimeline(growthComputeInput),
    [growthComputeInput],
  );
  const growthSyncSignature = useMemo(
    () => JSON.stringify(growthComputed.projections),
    [growthComputed.projections],
  );

  const firstMonth = months[0];
  const fallbackMonthlyWorkforce = firstMonth ? firstMonth.costs.labor : 0;
  const fallbackMonthlyFixed = firstMonth ? (firstMonth.costs.fixed ?? 0) : 0;
  const fallbackMonthlyMarketing = firstMonth ? firstMonth.costs.marketing : 0;
  const fallbackBaseBookings =
    months.length > 0 && unitEconomics.pricePerUnit > 0
      ? Math.round(
          months.reduce(
            (sum, month) =>
              sum +
              (month.revenue > 0
                ? month.revenue / unitEconomics.pricePerUnit
                : 0),
            0,
          ) / months.length,
        )
      : 0;

  const suggestedPricePerUnit = derived.hasPriceSignal
    ? derived.averagePricePerOutput
    : unitEconomics.pricePerUnit;
  const suggestedVariableCostPerUnit = derived.hasCapacityOutput
    ? derived.variableCostPerOutput
    : unitEconomics.variableCostPerUnit;
  const suggestedMonthlyWorkforce =
    derived.monthlyWorkforceCost > 0
      ? derived.monthlyWorkforceCost
      : fallbackMonthlyWorkforce;
  const suggestedMonthlyFixedOnly =
    derived.monthlyFixedCost > 0
      ? derived.monthlyFixedCost
      : fallbackMonthlyFixed;
  const suggestedMonthlyMarketing =
    derived.monthlyMarketing > 0
      ? derived.monthlyMarketing
      : fallbackMonthlyMarketing;
  const suggestedBaseBookings = derived.hasCapacityOutput
    ? derived.baseOutputPerMonth
    : fallbackBaseBookings;
  const suggestedMaxOutputPerMonth =
    derived.totalMaxOutputPerMonth > 0
      ? derived.totalMaxOutputPerMonth
      : undefined;

  const lastGrowthSyncSignatureRef = useRef('');
  const didAutoInitRef = useRef(false);
  const lastAutoSyncSignatureRef = useRef('');
  const autoSyncSignature = JSON.stringify({
    seasonCoefficients,
    pricePerUnit: round2(suggestedPricePerUnit),
    variableCostPerUnit: round2(suggestedVariableCostPerUnit),
    monthlyWorkforce: round2(suggestedMonthlyWorkforce),
    monthlyFixed: round2(suggestedMonthlyFixedOnly),
    monthlyMarketing: round2(suggestedMonthlyMarketing),
    baseBookings: Math.max(0, Math.round(suggestedBaseBookings)),
    maxOutputPerMonth: suggestedMaxOutputPerMonth ?? null,
  });
  useEffect(() => {
    if (!isGrowthDriven || !canEdit) return;
    if (lastGrowthSyncSignatureRef.current === growthSyncSignature) return;
    const unitEconomicsFromGrowth = deriveUnitEconomicsFromGrowthMonths(
      growthComputed.months,
      round2(growthComputeInput.basePricePerUnit),
      round2(suggestedVariableCostPerUnit),
      round2(
        suggestedMonthlyWorkforce +
          suggestedMonthlyFixedOnly +
          suggestedMonthlyMarketing,
      ),
    );
    updateData((prev) => ({
      ...prev,
      months: growthComputed.projections,
      unitEconomics: unitEconomicsFromGrowth,
    }));
    lastGrowthSyncSignatureRef.current = growthSyncSignature;
  }, [
    canEdit,
    growthComputeInput.basePricePerUnit,
    growthComputed.months,
    growthSyncSignature,
    growthComputed.projections,
    isGrowthDriven,
    suggestedMonthlyFixedOnly,
    suggestedMonthlyMarketing,
    suggestedMonthlyWorkforce,
    suggestedVariableCostPerUnit,
    updateData,
  ]);

  useEffect(() => {
    if (didAutoInitRef.current) return;
    if (isLoading || isProductServiceLoading || isOperationsLoading || isMarketingLoading) return;
    if (!canEdit) return;
    if (months.length > 0) {
      didAutoInitRef.current = true;
      return;
    }
    if (suggestedBaseBookings <= 0) return;

    const pricePerUnit = round2(suggestedPricePerUnit);
    const variableCostPerUnit = round2(suggestedVariableCostPerUnit);
    const monthlyWorkforce = round2(suggestedMonthlyWorkforce);
    const monthlyFixed = round2(suggestedMonthlyFixedOnly);
    const monthlyMarketing = round2(suggestedMonthlyMarketing);
    const baseBookings = Math.max(0, Math.round(suggestedBaseBookings));
    const generatedMonths = generateMonthsFromCoefficients(
      seasonCoefficients,
      pricePerUnit,
      variableCostPerUnit,
      monthlyWorkforce,
      monthlyFixed,
      monthlyMarketing,
      baseBookings,
      suggestedMaxOutputPerMonth,
    );

    updateData((prev) => {
      const safeUnitEconomics = {
        pricePerUnit: prev.unitEconomics?.pricePerUnit ?? 0,
        variableCostPerUnit: prev.unitEconomics?.variableCostPerUnit ?? 0,
        profitPerUnit: prev.unitEconomics?.profitPerUnit ?? 0,
        breakEvenUnits: prev.unitEconomics?.breakEvenUnits ?? 0,
      };
      const totalOverhead = monthlyWorkforce + monthlyFixed + monthlyMarketing;
      return {
        ...prev,
        unitEconomics: {
          ...safeUnitEconomics,
          pricePerUnit,
          variableCostPerUnit,
          profitPerUnit: round2(pricePerUnit - variableCostPerUnit),
          breakEvenUnits:
            pricePerUnit - variableCostPerUnit > 0
              ? Math.ceil(totalOverhead / (pricePerUnit - variableCostPerUnit))
              : 0,
        },
        months: generatedMonths,
      };
    });
    didAutoInitRef.current = true;
    lastAutoSyncSignatureRef.current = autoSyncSignature;
  }, [
    autoSyncSignature,
    canEdit,
    isLoading,
    isMarketingLoading,
    isOperationsLoading,
    isProductServiceLoading,
    months.length,
    seasonCoefficients,
    suggestedPricePerUnit,
    suggestedBaseBookings,
    suggestedVariableCostPerUnit,
    suggestedMaxOutputPerMonth,
    suggestedMonthlyWorkforce,
    suggestedMonthlyFixedOnly,
    suggestedMonthlyMarketing,
    updateData,
  ]);

  useEffect(() => {
    if (isLoading || isProductServiceLoading || isOperationsLoading || isMarketingLoading) return;
    if (!canEdit || isGrowthDriven) return;
    if (months.length === 0) return;
    if (lastAutoSyncSignatureRef.current === autoSyncSignature) return;

    const pricePerUnit = round2(suggestedPricePerUnit);
    const variableCostPerUnit = round2(suggestedVariableCostPerUnit);
    const monthlyWorkforce = round2(suggestedMonthlyWorkforce);
    const monthlyFixed = round2(suggestedMonthlyFixedOnly);
    const monthlyMarketing = round2(suggestedMonthlyMarketing);
    const baseBookings = Math.max(0, Math.round(suggestedBaseBookings));
    const generatedMonths = generateMonthsFromCoefficients(
      seasonCoefficients,
      pricePerUnit,
      variableCostPerUnit,
      monthlyWorkforce,
      monthlyFixed,
      monthlyMarketing,
      baseBookings,
      suggestedMaxOutputPerMonth,
    );

    updateData((prev) => {
      const safeUnitEconomics = {
        pricePerUnit: prev.unitEconomics?.pricePerUnit ?? 0,
        variableCostPerUnit: prev.unitEconomics?.variableCostPerUnit ?? 0,
        profitPerUnit: prev.unitEconomics?.profitPerUnit ?? 0,
        breakEvenUnits: prev.unitEconomics?.breakEvenUnits ?? 0,
      };
      const totalOverhead = monthlyWorkforce + monthlyFixed + monthlyMarketing;
      return {
        ...prev,
        unitEconomics: {
          ...safeUnitEconomics,
          pricePerUnit,
          variableCostPerUnit,
          profitPerUnit: round2(pricePerUnit - variableCostPerUnit),
          breakEvenUnits:
            pricePerUnit - variableCostPerUnit > 0
              ? Math.ceil(totalOverhead / (pricePerUnit - variableCostPerUnit))
              : 0,
        },
        months: generatedMonths,
      };
    });
    lastAutoSyncSignatureRef.current = autoSyncSignature;
  }, [
    autoSyncSignature,
    canEdit,
    isGrowthDriven,
    isLoading,
    isMarketingLoading,
    isOperationsLoading,
    isProductServiceLoading,
    months.length,
    seasonCoefficients,
    suggestedPricePerUnit,
    suggestedBaseBookings,
    suggestedVariableCostPerUnit,
    suggestedMaxOutputPerMonth,
    suggestedMonthlyWorkforce,
    suggestedMonthlyFixedOnly,
    suggestedMonthlyMarketing,
    updateData,
  ]);

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader showScenarioBadge title="Financial Projections" description="Loading..." />
      </div>
    );
  }

  function updateStartingCash(value: number) {
    updateData((prev) => ({ ...prev, startingCash: Number.isFinite(value) ? value : 0 }));
  }

  function updateUnitEconomics(field: 'pricePerUnit' | 'variableCostPerUnit', value: number) {
    updateData((prev) => {
      const ue = { ...prev.unitEconomics, [field]: value };
      const safe = {
        pricePerUnit: ue.pricePerUnit ?? 0,
        variableCostPerUnit: ue.variableCostPerUnit ?? 0,
        profitPerUnit: ue.profitPerUnit ?? 0,
        breakEvenUnits: ue.breakEvenUnits ?? 0,
      };
      const next = { ...safe, [field]: value };
      next.profitPerUnit = next.pricePerUnit - next.variableCostPerUnit;
      const monthlyOverhead =
        suggestedMonthlyWorkforce +
        suggestedMonthlyFixedOnly +
        suggestedMonthlyMarketing;
      next.breakEvenUnits = next.profitPerUnit > 0 ? Math.ceil(monthlyOverhead / next.profitPerUnit) : 0;
      return { ...prev, unitEconomics: next };
    });
  }

  // When growth timeline drives projections, disable manual editing
  const effectiveCanEdit = canEdit && !isGrowthDriven;

  return (
    <div className="page-container">
      <PageHeader showScenarioBadge title="Financial Projections" description="Revenue forecasts, cost structure, and profitability analysis" />

      {/* Growth Timeline auto-sync banner */}
      {isGrowthDriven && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <Info className="size-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-200">
              Projections driven by Growth Timeline
            </p>
            <p className="text-blue-700 dark:text-blue-300 mt-0.5">
              Monthly data is auto-synced from your growth events. Manual editing is disabled.{' '}
              <Link
                to={`/business/${businessId}/growth-timeline`}
                className="underline underline-offset-2 font-medium"
              >
                Go to Growth Timeline
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Cash Setup */}
      <div className="card-elevated rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold">Cash Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Starting Cash Balance
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                className="pl-7 tabular-nums"
                value={startingCash}
                onChange={(e) => updateStartingCash(Number(e.target.value))}
                readOnly={!canEdit}
              />
            </div>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Ending Cash (Last Month)</p>
            <p className={`text-lg font-semibold tabular-nums ${endingCashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(endingCashBalance)}
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Lowest Cash Balance</p>
            <p className={`text-lg font-semibold tabular-nums ${minCashBalance >= 0 ? 'text-foreground' : 'text-red-600'}`}>
              {formatCurrency(minCashBalance)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ending cash is calculated month-by-month: previous cash + (revenue - total costs + financing cash flows).
        </p>
      </div>

      {/* Aggregate Stats */}
      <div className="stat-grid">
        <StatCard
          label="Starting Cash"
          value={formatCurrency(startingCash)}
          sublabel="opening balance"
          trend={startingCash > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          label="Ending Cash"
          value={formatCurrency(endingCashBalance)}
          sublabel={firstNegativeCashMonthLabel ? `negative in ${firstNegativeCashMonthLabel}` : 'stays positive'}
          trend={endingCashBalance >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Lowest Cash"
          value={formatCurrency(minCashBalance)}
          sublabel="minimum during period"
          trend={minCashBalance >= 0 ? 'neutral' : 'down'}
        />
        <StatCard
          label="12-Month Revenue"
          value={formatCurrency(totalRevenue)}
          sublabel={`avg ${formatCurrency(avgMonthlyRevenue)}/mo`}
          trend={totalRevenue > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          label="12-Month Costs"
          value={formatCurrency(totalCosts)}
          sublabel={`avg ${formatCurrency(totalCosts / Math.max(months.length, 1))}/mo`}
        />
        <StatCard
          label="12-Month Profit"
          value={formatCurrency(totalProfit)}
          sublabel={`avg ${formatCurrency(avgMonthlyProfit)}/mo`}
          trend={totalProfit >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Profit Margin"
          value={`${(profitMargin * 100).toFixed(1)}%`}
          sublabel={`break-even: ${unitEconomics.breakEvenUnits} units/mo`}
          trend={profitMargin >= 0.15 ? 'up' : profitMargin >= 0 ? 'neutral' : 'down'}
        />
      </div>

      {/* Revenue vs Costs Chart */}
      <div className="card-elevated rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Revenue, Costs, Profit, and Cash Balance</h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} labelStyle={{ fontWeight: 600 }} />
              <Legend />
              <Area type="monotone" dataKey="Revenue" stroke="var(--chart-revenue)" fill="var(--chart-revenue)" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="Total Costs" stroke="var(--chart-cost)" fill="var(--chart-cost)" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="Profit" stroke="var(--chart-profit)" fill="var(--chart-profit)" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="Cash Balance" stroke="var(--chart-accent-1)" fill="var(--chart-accent-1)" fillOpacity={0.08} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Profit Chart */}
      <div className="card-elevated rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Monthly Profit</h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profitBarData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="Profit" radius={[4, 4, 0, 0]}>
                {profitBarData.map((entry, index) => (
                  <Cell key={index} fill={entry.Profit >= 0 ? 'var(--chart-revenue)' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash Balance Chart */}
      <div className="card-elevated rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Cash Balance Projection</h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashBalanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
              <Legend />
              <Area
                type="monotone"
                dataKey="Ending Cash"
                stroke="var(--chart-accent-1)"
                fill="var(--chart-accent-1)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seasonality Editor */}
      <div className="card-elevated rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Seasonality Coefficients</h3>
          {effectiveCanEdit && (
            <div className="flex gap-1">
              <Button
                variant={JSON.stringify(seasonCoefficients) === JSON.stringify(SEASON_PRESET_FLAT) ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateData((prev) => ({ ...prev, seasonCoefficients: SEASON_PRESET_FLAT }))}
              >
                Flat
              </Button>
              <Button
                variant={JSON.stringify(seasonCoefficients) === JSON.stringify(SEASON_PRESET_SUMMER_PEAK) ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateData((prev) => ({ ...prev, seasonCoefficients: SEASON_PRESET_SUMMER_PEAK }))}
              >
                Summer Peak
              </Button>
            </div>
          )}
        </div>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={seasonCoefficients.map((coeff, i) => ({
                month: MONTH_LABELS[i],
                Coefficient: coeff,
              }))}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 2]} tickFormatter={(v: number) => v.toFixed(1)} />
              <Tooltip formatter={(value) => Number(value).toFixed(2)} />
              <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '1.0', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
              <Bar dataKey="Coefficient" radius={[4, 4, 0, 0]}>
                {seasonCoefficients.map((coeff, index) => (
                  <Cell key={index} fill={coeff >= 1.0 ? 'var(--chart-revenue)' : 'var(--chart-accent-2)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-12 gap-1">
          {MONTH_LABELS.map((label, i) => (
            <div key={i} className="text-center">
              <label className="text-[10px] font-medium text-muted-foreground block mb-0.5">{label}</label>
              <Input
                type="number"
                step="0.05"
                min="0"
                max="2"
                value={seasonCoefficients[i]}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(2, Number(e.target.value)));
                  updateData((prev) => {
                    const coeffs =
                      Array.isArray(prev.seasonCoefficients) &&
                      prev.seasonCoefficients.length === 12
                        ? [...prev.seasonCoefficients]
                        : [...SEASON_PRESET_FLAT];
                    coeffs[i] = val;
                    return { ...prev, seasonCoefficients: coeffs };
                  });
                }}
                className="h-7 text-[11px] text-center px-0.5 tabular-nums"
                readOnly={!effectiveCanEdit}
              />
            </div>
          ))}
        </div>

        {effectiveCanEdit && (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                const coeffs = seasonCoefficients;
                const pricePerUnit = round2(suggestedPricePerUnit);
                const variableCostPerUnit = round2(suggestedVariableCostPerUnit);
                const monthlyWorkforce = round2(suggestedMonthlyWorkforce);
                const monthlyFixed = round2(suggestedMonthlyFixedOnly);
                const monthlyMarketing = round2(suggestedMonthlyMarketing);
                const baseBookings = Math.max(0, Math.round(suggestedBaseBookings));
                const newMonths = generateMonthsFromCoefficients(
                  coeffs,
                  pricePerUnit,
                  variableCostPerUnit,
                  monthlyWorkforce,
                  monthlyFixed,
                  monthlyMarketing,
                  baseBookings,
                  suggestedMaxOutputPerMonth,
                );
                updateData((prev) => {
                  const safeUnitEconomics = {
                    pricePerUnit: prev.unitEconomics?.pricePerUnit ?? 0,
                    variableCostPerUnit: prev.unitEconomics?.variableCostPerUnit ?? 0,
                    profitPerUnit: prev.unitEconomics?.profitPerUnit ?? 0,
                    breakEvenUnits: prev.unitEconomics?.breakEvenUnits ?? 0,
                  };
                  const totalOverhead = monthlyWorkforce + monthlyFixed + monthlyMarketing;
                  const unitEconomics = {
                    ...safeUnitEconomics,
                    pricePerUnit,
                    variableCostPerUnit,
                    profitPerUnit: round2(pricePerUnit - variableCostPerUnit),
                    breakEvenUnits:
                      pricePerUnit - variableCostPerUnit > 0
                        ? Math.ceil(totalOverhead / (pricePerUnit - variableCostPerUnit))
                        : 0,
                  };
                  return { ...prev, unitEconomics, months: newMonths };
                });
                lastAutoSyncSignatureRef.current = autoSyncSignature;
              }}
            >
              <RefreshCw className="size-4 mr-1.5" />
              Recalculate From Capacity & Pricing
            </Button>
          </div>
        )}
      </div>

      {/* Cost Structure Pie Chart */}
      {costPieData.length > 0 && (
        <div className="card-elevated rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">12-Month Cost Structure</h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costPieData} cx="50%" cy="50%" outerRadius={95} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {costPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly P&L Table */}
      <div className="card-elevated rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-0">
          <h3 className="text-sm font-semibold">Monthly P&L</h3>
        </div>
        <p className="px-4 pt-1 text-xs text-muted-foreground">
          Revenue is calculated from monthly output and price per unit. Costs are grouped as Marketing, Variable, and Fixed.
        </p>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground uppercase">Month</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Revenue</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Marketing</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Variable Cost</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Fixed Cost</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Profit</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Net Cash Flow</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Ending Cash</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => {
                const totalC = sumMonthlyCosts(m.costs);
                const profit = m.revenue - totalC;
                const netCashFlow = cashProjection[i]?.netCashFlow ?? profit;
                const endingCash = cashProjection[i]?.endingCash ?? startingCash;
                const variableCost = getVariableCosts(m.costs);
                const fixedCost = getFixedCosts(m.costs);
                return (
                  <tr key={i} className={`border-b last:border-b-0 ${profit >= 0 ? '' : 'bg-red-50/50 dark:bg-red-950/10'}`}>
                    <td className="py-1.5 px-2 text-xs font-medium">{m.month}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{formatCurrency(m.revenue)}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{formatCurrency(m.costs.marketing ?? 0)}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{formatCurrency(variableCost)}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{formatCurrency(fixedCost)}</td>
                    <td className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground tabular-nums">{formatCurrency(totalC)}</td>
                    <td className={`py-1.5 px-2 text-right text-xs font-semibold tabular-nums ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</td>
                    <td className={`py-1.5 px-2 text-right text-xs font-semibold tabular-nums ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netCashFlow)}</td>
                    <td className={`py-1.5 px-2 text-right text-xs font-semibold tabular-nums ${endingCash >= 0 ? 'text-foreground' : 'text-red-600'}`}>{formatCurrency(endingCash)}</td>
                  </tr>
                );
              })}
              {/* Totals row */}
              {months.length > 0 && (
                <tr className="border-t-2 font-semibold">
                  <td className="py-2 px-2 text-xs uppercase">Total</td>
                  <td className="py-2 px-2 text-right text-xs text-green-600 tabular-nums">{formatCurrency(totalRevenue)}</td>
                  <td className="py-2 px-2 text-right text-xs tabular-nums">{formatCurrency(totalMarketingCosts)}</td>
                  <td className="py-2 px-2 text-right text-xs tabular-nums">{formatCurrency(totalVariableCosts)}</td>
                  <td className="py-2 px-2 text-right text-xs tabular-nums">{formatCurrency(totalFixedCosts)}</td>
                  <td className="py-2 px-2 text-right text-xs text-red-600 tabular-nums">{formatCurrency(totalCosts)}</td>
                  <td className={`py-2 px-2 text-right text-xs tabular-nums ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</td>
                  <td className={`py-2 px-2 text-right text-xs tabular-nums ${totalNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalNetCashFlow)}</td>
                  <td className={`py-2 px-2 text-right text-xs tabular-nums ${endingCashBalance >= 0 ? 'text-foreground' : 'text-red-600'}`}>{formatCurrency(endingCashBalance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit Economics */}
      <div className="card-elevated rounded-lg p-4 space-y-4">
        <h2 className="text-sm font-semibold">Unit Economics</h2>

        {/* Capacity context */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Capacity Planned / Month</p>
            <p className="text-lg font-semibold tabular-nums">{Math.round(derived.baseOutputPerMonth).toLocaleString()}</p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Capacity Max / Month</p>
            <p className="text-lg font-semibold tabular-nums">{Math.round(derived.totalMaxOutputPerMonth).toLocaleString()}</p>
          </div>
        </div>

        {/* Per-unit breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Price per Unit — editable */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price / Unit</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input type="number" className="pl-7 tabular-nums" value={unitEconomics.pricePerUnit} onChange={(e) => updateUnitEconomics('pricePerUnit', Number(e.target.value))} readOnly={!effectiveCanEdit} />
            </div>
          </div>
          {/* Variable Cost — editable, shown as negative */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Variable Cost / Unit</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-sm">-$</span>
              <Input type="number" className="pl-8 tabular-nums text-red-600" value={unitEconomics.variableCostPerUnit} onChange={(e) => updateUnitEconomics('variableCostPerUnit', Number(e.target.value))} readOnly={!effectiveCanEdit} />
            </div>
          </div>
          {/* Fixed Cost / Month — read-only derived */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fixed Cost / Month</p>
            <div className="mt-1 flex h-9 items-center rounded-md bg-muted px-3 text-sm font-semibold tabular-nums text-red-600">
              -{formatCurrency(suggestedMonthlyWorkforce + suggestedMonthlyFixedOnly + suggestedMonthlyMarketing)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Labor + fixed + marketing</p>
          </div>
          {/* Profit Per Unit — computed */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profit / Unit</p>
            <div className={`mt-1 flex h-9 items-center rounded-md px-3 text-sm font-semibold tabular-nums ${unitEconomics.profitPerUnit >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
              {unitEconomics.profitPerUnit >= 0 ? <TrendingUp className="size-3.5 mr-1.5 shrink-0" /> : <TrendingDown className="size-3.5 mr-1.5 shrink-0" />}
              {formatCurrency(unitEconomics.profitPerUnit)}
            </div>
          </div>
          {/* Break-Even — computed */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Break-Even / Mo</p>
            <div className="mt-1 flex h-9 items-center rounded-md bg-muted px-3 text-sm font-semibold tabular-nums">
              {unitEconomics.breakEvenUnits} units
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">To cover monthly overhead</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Derived from Product/Service prices, Operations capacity/costs, and Marketing budgets.
          {isProductServiceLoading || isOperationsLoading || isMarketingLoading ? ' Loading...' : ''}
        </p>
      </div>

    </div>
  );
}
