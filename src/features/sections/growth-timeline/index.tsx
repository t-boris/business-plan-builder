import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useSection } from '@/hooks/use-section';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Milestone, Plus } from 'lucide-react';
import type {
  GrowthTimeline as GrowthTimelineType,
  GrowthEvent,
  MonthlyProjection,
  Operations as OperationsType,
  FinancialProjections as FinancialProjectionsType,
  KpisMetrics as KpisMetricsType,
  MarketingStrategy as MarketingStrategyType,
  ProductService as ProductServiceType,
} from '@/types';
import { scenarioHorizonAtom } from '@/store/scenario-atoms';
import { activeBusinessIdAtom } from '@/store/business-atoms';
import { saveSectionData } from '@/lib/business-firestore';
import { defaultGrowthTimeline } from './defaults';
import { computeGrowthTimeline } from './compute';
import type { GrowthComputeInput } from './compute';
import { EventCard } from './components/event-card';
import { EventForm } from './components/event-form';
import { ProjectionPreview } from './components/projection-preview';
import { useRef, useEffect, useCallback } from 'react';
import { normalizeProductService } from '@/features/sections/product-service/normalize';

const defaultOperations: OperationsType = {
  workforce: [],
  capacityItems: [],
  variableComponents: [],
  costItems: [],
  equipment: [],
  safetyProtocols: [],
  operationalMetrics: [],
};

const defaultFinancials: FinancialProjectionsType = {
  startingCash: 0,
  months: [],
  unitEconomics: { pricePerUnit: 0, variableCostPerUnit: 0, profitPerUnit: 0, breakEvenUnits: 0 },
  seasonCoefficients: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

const defaultMarketing: MarketingStrategyType = {
  channels: [],
  offers: [],
  landingPage: { url: '', description: '' },
};

const defaultProductService: ProductServiceType = {
  offerings: [],
  addOns: [],
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
    const utilization = item.utilizationRate > 0 ? item.utilizationRate / 100 : 1;
    return sum + effective * utilization;
  }, 0);
}

export function GrowthTimeline() {
  const { data, updateData, isLoading, canEdit } = useSection<GrowthTimelineType>(
    'growth-timeline',
    defaultGrowthTimeline,
  );
  const { data: operations } = useSection<OperationsType>('operations', defaultOperations);
  const { data: financials } = useSection<FinancialProjectionsType>(
    'financial-projections',
    defaultFinancials,
  );
  const { data: kpis } = useSection<KpisMetricsType>('kpis-metrics', defaultKpis);
  const { data: marketing } = useSection<MarketingStrategyType>(
    'marketing-strategy',
    defaultMarketing,
  );
  const { data: productService } = useSection<ProductServiceType>(
    'product-service',
    defaultProductService,
  );

  const horizonMonths = useAtomValue(scenarioHorizonAtom);
  const businessId = useAtomValue(activeBusinessIdAtom);

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GrowthEvent | null>(null);

  // Compute inputs
  const baseMarketingBudget = marketing.channels.reduce((sum, ch) => sum + ch.budget, 0);
  const baseBookingsFromOperations = useMemo(
    () => deriveBaseBookingsFromOperations(operations),
    [operations],
  );
  const normalizedProductService = useMemo(
    () => normalizeProductService(productService),
    [productService],
  );

  // Derive pricePerUnit: financials → KPIs → average offering price
  const pricePerUnitFromOfferings = useMemo(() => {
    const prices = normalizedProductService.offerings
      .map((o) => o.price)
      .filter((p): p is number => p !== null && p > 0);
    return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  }, [normalizedProductService.offerings]);

  const computeInput: GrowthComputeInput = useMemo(
    () => {
      const legacyFinancialPrice = (financials.unitEconomics as { avgCheck?: number } | undefined)?.avgCheck;
      const legacyKpiPrice = (kpis.targets as { avgCheck?: number } | undefined)?.avgCheck;

      return {
        operations,
        basePricePerUnit:
          financials.unitEconomics.pricePerUnit ||
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
        seasonCoefficients: financials.seasonCoefficients ?? [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        horizonMonths,
        events: data.events,
      };
    },
    [operations, financials, kpis, pricePerUnitFromOfferings, baseBookingsFromOperations, baseMarketingBudget, horizonMonths, data.events],
  );

  const result = useMemo(() => computeGrowthTimeline(computeInput), [computeInput]);

  // Auto-sync to financial projections
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncToFinancialProjections = useCallback(
    (projections: MonthlyProjection[]) => {
      if (!businessId) return;
      if (syncRef.current) clearTimeout(syncRef.current);
      syncRef.current = setTimeout(() => {
        saveSectionData(businessId, 'financial-projections', {
          months: projections,
        }).catch(() => {});
      }, 1000);
    },
    [businessId],
  );

  useEffect(() => {
    const enabledEvents = data.events.filter((e) => e.enabled);
    if (data.autoSync && enabledEvents.length > 0 && canEdit) {
      syncToFinancialProjections(result.projections);
    }
    return () => {
      if (syncRef.current) clearTimeout(syncRef.current);
    };
  }, [data.autoSync, data.events, canEdit, result.projections, syncToFinancialProjections]);

  // CRUD handlers
  function handleAddEvent(event: GrowthEvent) {
    updateData((prev) => ({
      ...prev,
      events: [...prev.events, event].sort((a, b) => a.month - b.month),
    }));
    setShowForm(false);
  }

  function handleUpdateEvent(event: GrowthEvent) {
    updateData((prev) => ({
      ...prev,
      events: prev.events
        .map((e) => (e.id === event.id ? event : e))
        .sort((a, b) => a.month - b.month),
    }));
    setEditingEvent(null);
  }

  function handleDeleteEvent(id: string) {
    updateData((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
  }

  function handleToggleEvent(id: string) {
    updateData((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === id ? { ...e, enabled: !e.enabled } : e,
      ),
    }));
  }

  function handleToggleAutoSync(checked: boolean) {
    updateData((prev) => ({ ...prev, autoSync: checked }));
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader showScenarioBadge title="Growth Timeline" description="Loading..." />
      </div>
    );
  }

  // Group events by month
  const eventsByMonth = data.events.reduce<Record<number, GrowthEvent[]>>((acc, event) => {
    if (!acc[event.month]) acc[event.month] = [];
    acc[event.month].push(event);
    return acc;
  }, {});

  const sortedMonths = Object.keys(eventsByMonth)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="page-container">
      <PageHeader showScenarioBadge
        title="Growth Timeline"
        description="Model gradual business development: hiring, capacity scaling, and cost changes over time"
      >
        {canEdit && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                size="sm"
                checked={data.autoSync}
                onCheckedChange={handleToggleAutoSync}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Auto-sync to Financials
              </span>
            </div>
            <Button size="sm" onClick={() => { setEditingEvent(null); setShowForm(true); }}>
              <Plus className="size-4" />
              Add Event
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Event Form (add/edit) */}
      {showForm && !editingEvent && (
        <EventForm
          horizonMonths={horizonMonths}
          capacityItems={operations.capacityItems}
          onSave={handleAddEvent}
          onCancel={() => setShowForm(false)}
        />
      )}
      {editingEvent && (
        <EventForm
          horizonMonths={horizonMonths}
          capacityItems={operations.capacityItems}
          initial={editingEvent}
          onSave={handleUpdateEvent}
          onCancel={() => setEditingEvent(null)}
        />
      )}

      {/* Empty state */}
      {data.events.length === 0 && !showForm && (
        <EmptyState
          icon={Milestone}
          title="No growth events"
          description="Add events to model how your business evolves over time — hiring, capacity changes, cost adjustments."
          action={canEdit ? { label: 'Add Event', onClick: () => setShowForm(true) } : undefined}
        />
      )}

      {/* Events grouped by month */}
      {sortedMonths.length > 0 && (
        <div className="relative">
          {sortedMonths.length > 1 && (
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border" />
          )}
          <div className="space-y-4">
            {sortedMonths.map((month) => (
              <div key={month} className="relative pl-12">
                <div className="absolute left-3 top-3 z-10 size-4 rounded-full border-2 border-primary bg-background" />
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Month {month}
                  </h3>
                  <div className="space-y-2">
                    {eventsByMonth[month].map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        canEdit={canEdit}
                        onToggle={handleToggleEvent}
                        onEdit={(e) => { setShowForm(false); setEditingEvent(e); }}
                        onDelete={handleDeleteEvent}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projection Preview */}
      {data.events.length > 0 && (
        <ProjectionPreview result={result} horizonMonths={horizonMonths} />
      )}
    </div>
  );
}
