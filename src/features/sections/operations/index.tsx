import { useEffect, useRef } from 'react';
import { useSection } from '@/hooks/use-section';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { EmptyState } from '@/components/empty-state';
import { normalizeOperations } from './normalize';
import { computeOperationsCosts } from './compute';
import { normalizeProductService } from '@/features/sections/product-service/normalize';
import type {
  Operations as OperationsType,
  WorkforceMember,
  CostItem,
  CostDriverType,
  OperationalMetric,
  CapacityItem,
  VariableCostComponent,
  VariableComponentSourcing,
  ProductService as ProductServiceType,
} from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Plus,
  Trash2,
  AlertTriangle,
  Users,
  Package,
  ShieldAlert,
  ChevronDown,
  Activity,
  Settings,
  DollarSign,
  Gauge,
} from 'lucide-react';

const DRIVER_TYPE_OPTIONS: { value: CostDriverType; label: string }[] = [
  { value: 'per-unit', label: 'Per Unit' },
  { value: 'per-order', label: 'Per Order' },
  { value: 'per-service-hour', label: 'Per Service Hour' },
  { value: 'per-machine-hour', label: 'Per Machine Hour' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const SOURCING_MODEL_OPTIONS: { value: VariableComponentSourcing; label: string }[] = [
  { value: 'in-house', label: 'In-house' },
  { value: 'purchase-order', label: 'Purchase Order' },
  { value: 'on-demand', label: 'On-demand' },
];

const defaultOperations: OperationsType = {
  workforce: [],
  capacityItems: [],
  variableComponents: [],
  costItems: [],
  equipment: [],
  safetyProtocols: [],
  operationalMetrics: [],
};
const defaultProductService: ProductServiceType = {
  overview: '',
  offerings: [],
  addOns: [],
};

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtShort(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <CollapsibleTrigger asChild>
      <button className="flex items-center gap-2 w-full text-left py-2 group" type="button">
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
      </button>
    </CollapsibleTrigger>
  );
}

export function Operations() {
  const { data: rawData, updateData, isLoading, canEdit } = useSection<OperationsType>(
    'operations',
    defaultOperations,
  );
  const { data: rawProductService } = useSection<ProductServiceType>(
    'product-service',
    defaultProductService,
  );

  // Normalize legacy data on first load
  const hasNormalizedRef = useRef(false);
  useEffect(() => {
    if (isLoading || hasNormalizedRef.current) return;
    const norm = normalizeOperations(rawData);
    if (JSON.stringify(norm) !== JSON.stringify(rawData)) {
      updateData(() => norm);
    }
    hasNormalizedRef.current = true;
  }, [isLoading, rawData, updateData]);

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader showScenarioBadge sectionSlug="operations" title="Operations" description="Loading..." />
      </div>
    );
  }

  const displayData = rawData;
  const normalizedProductService = normalizeProductService(rawProductService);

  const summary = computeOperationsCosts(displayData);

  // --- Workforce helpers ---

  function addWorkforceMember() {
    updateData((prev) => ({
      ...prev,
      workforce: [...prev.workforce, { role: '', count: 1, ratePerHour: 0, hoursPerWeek: 40 }],
    }));
  }

  function removeWorkforceMember(index: number) {
    updateData((prev) => ({
      ...prev,
      workforce: prev.workforce.filter((_, i) => i !== index),
    }));
  }

  function updateWorkforceMember(index: number, field: keyof WorkforceMember, value: string | number) {
    updateData((prev) => {
      const workforce = [...prev.workforce];
      workforce[index] = { ...workforce[index], [field]: value };
      return { ...prev, workforce };
    });
  }

  // --- Capacity helpers ---

  function addCapacityItem() {
    updateData((prev) => ({
      ...prev,
      capacityItems: [
        ...prev.capacityItems,
        {
          id: crypto.randomUUID(),
          name: '',
          outputUnitLabel: '',
          plannedOutputPerMonth: 0,
          maxOutputPerDay: 0,
          maxOutputPerWeek: 0,
          maxOutputPerMonth: 0,
          utilizationRate: 0,
        },
      ],
    }));
  }

  function removeCapacityItem(index: number) {
    updateData((prev) => ({
      ...prev,
      capacityItems: prev.capacityItems.filter((_, i) => i !== index),
    }));
  }

  function updateCapacityItem(
    index: number,
    field: keyof CapacityItem,
    value: string | number | undefined,
  ) {
    updateData((prev) => {
      const capacityItems = [...prev.capacityItems];
      const current = capacityItems[index];
      if (!current) return prev;
      const next = { ...current } as Record<string, unknown>;
      if (value === undefined) {
        delete next[field as string];
      } else {
        next[field as string] = value;
      }
      capacityItems[index] = next as CapacityItem;
      return { ...prev, capacityItems };
    });
  }

  function linkCapacityItemToOffering(index: number, offeringId: string) {
    const offering = normalizedProductService.offerings.find((o) => o.id === offeringId);
    updateData((prev) => {
      const capacityItems = [...prev.capacityItems];
      const current = capacityItems[index];
      capacityItems[index] = {
        ...current,
        offeringId,
        name: current.name.trim().length > 0 ? current.name : (offering?.name ?? ''),
      };
      return { ...prev, capacityItems };
    });
  }

  function unlinkCapacityItemOffering(index: number) {
    updateCapacityItem(index, 'offeringId', undefined);
  }

  // --- Variable Components helpers ---

  function addVariableComponent() {
    updateData((prev) => ({
      ...prev,
      variableComponents: [
        ...prev.variableComponents,
        {
          id: crypto.randomUUID(),
          name: '',
          sourcingModel: 'in-house',
          componentUnitLabel: 'unit',
          costPerComponentUnit: 0,
          componentUnitsPerOutput: 0,
          orderQuantity: 0,
          orderFee: 0,
        },
      ],
    }));
  }

  function removeVariableComponent(index: number) {
    updateData((prev) => ({
      ...prev,
      variableComponents: prev.variableComponents.filter((_, i) => i !== index),
    }));
  }

  function updateVariableComponent(
    index: number,
    field: keyof VariableCostComponent,
    value: string | number | undefined,
  ) {
    updateData((prev) => {
      const variableComponents = [...prev.variableComponents];
      const current = variableComponents[index];
      if (!current) return prev;

      const nextRecord = { ...current } as Record<string, unknown>;
      if (value === undefined) {
        delete nextRecord[field as string];
      } else {
        nextRecord[field as string] = value;
      }
      let next = nextRecord as VariableCostComponent;
      // If user enters order economics while still "in-house",
      // switch to purchase-order so order fees are included in totals.
      if (
        (field === 'orderQuantity' || field === 'orderFee') &&
        typeof value === 'number' &&
        value > 0 &&
        current.sourcingModel === 'in-house'
      ) {
        next = { ...next, sourcingModel: 'purchase-order' };
      }

      variableComponents[index] = next;
      return { ...prev, variableComponents };
    });
  }

  function linkVariableComponentToOffering(index: number, offeringId: string) {
    const offering = normalizedProductService.offerings.find((o) => o.id === offeringId);
    updateData((prev) => {
      const variableComponents = [...prev.variableComponents];
      const current = variableComponents[index];
      variableComponents[index] = {
        ...current,
        offeringId,
        name: current.name.trim().length > 0 ? current.name : (offering?.name ?? ''),
      };
      return { ...prev, variableComponents };
    });
  }

  function unlinkVariableComponentOffering(index: number) {
    updateVariableComponent(index, 'offeringId', undefined);
  }

  // --- Fixed Cost Item helpers ---

  function addFixedCostItem() {
    updateData((prev) => ({
      ...prev,
      costItems: [
        ...prev.costItems,
        {
          category: '',
          type: 'fixed',
          rate: 0,
          driverType: 'monthly' as CostDriverType,
          driverQuantityPerMonth: 1,
        },
      ],
    }));
  }

  function removeCostItem(realIndex: number) {
    updateData((prev) => ({
      ...prev,
      costItems: prev.costItems.filter((_, i) => i !== realIndex),
    }));
  }

  function updateCostItem(realIndex: number, field: keyof CostItem, value: string | number) {
    updateData((prev) => {
      const costItems = [...prev.costItems];
      costItems[realIndex] = { ...costItems[realIndex], [field]: value };
      return { ...prev, costItems };
    });
  }

  // --- Equipment helpers ---

  function addEquipment() {
    updateData((prev) => ({ ...prev, equipment: [...prev.equipment, ''] }));
  }

  function removeEquipment(index: number) {
    updateData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index),
    }));
  }

  function updateEquipment(index: number, value: string) {
    updateData((prev) => {
      const equipment = [...prev.equipment];
      equipment[index] = value;
      return { ...prev, equipment };
    });
  }

  // --- Safety helpers ---

  function addSafetyProtocol() {
    updateData((prev) => ({
      ...prev,
      safetyProtocols: [...prev.safetyProtocols, ''],
    }));
  }

  function removeSafetyProtocol(index: number) {
    updateData((prev) => ({
      ...prev,
      safetyProtocols: prev.safetyProtocols.filter((_, i) => i !== index),
    }));
  }

  function updateSafetyProtocol(index: number, value: string) {
    updateData((prev) => {
      const safetyProtocols = [...prev.safetyProtocols];
      safetyProtocols[index] = value;
      return { ...prev, safetyProtocols };
    });
  }

  // --- Metric helpers ---

  function addMetric() {
    updateData((prev) => ({
      ...prev,
      operationalMetrics: [
        ...prev.operationalMetrics,
        { name: '', unit: '', value: 0, target: 0 },
      ],
    }));
  }

  function removeMetric(index: number) {
    updateData((prev) => ({
      ...prev,
      operationalMetrics: prev.operationalMetrics.filter((_, i) => i !== index),
    }));
  }

  function updateMetric(index: number, field: keyof OperationalMetric, value: string | number) {
    updateData((prev) => {
      const operationalMetrics = [...prev.operationalMetrics];
      operationalMetrics[index] = { ...operationalMetrics[index], [field]: value };
      return { ...prev, operationalMetrics };
    });
  }

  // --- Derived indexes for variable components / fixed cost items ---

  const capacityItems = displayData.capacityItems ?? [];
  const totalPlannedOutput = capacityItems.reduce(
    (sum, item) => sum + Math.max(0, item.plannedOutputPerMonth),
    0,
  );
  // Compute mix within same-unit groups only
  const unitTotals = new Map<string, number>();
  for (const item of capacityItems) {
    const unit = (item.outputUnitLabel || 'unit').toLowerCase();
    unitTotals.set(unit, (unitTotals.get(unit) ?? 0) + Math.max(0, item.plannedOutputPerMonth));
  }
  const capacityItemsWithMix = capacityItems.map((item) => {
    const unit = (item.outputUnitLabel || 'unit').toLowerCase();
    const groupTotal = unitTotals.get(unit) ?? 0;
    return {
      ...item,
      mixPercent:
        groupTotal > 0
          ? (Math.max(0, item.plannedOutputPerMonth) / groupTotal) * 100
          : 0,
    };
  });

  const variableComponentsWithCosts = displayData.variableComponents.map((component, index) => ({
    component,
    // Prefer id matching, but fall back to same index to stay robust when
    // legacy data has unstable/missing ids.
    monthlyCost:
      summary.variableComponentCosts.find((line) => line.componentId === component.id) ??
      summary.variableComponentCosts[index],
    index,
  }));

  const fixedItems = displayData.costItems
    .map((item, realIndex) => ({ item, realIndex }))
    .filter(({ item }) => item.type === 'fixed');

  const fixedSubtotal = fixedItems.reduce((sum, { item }) => {
    switch (item.driverType) {
      case 'quarterly':
        return sum + (item.rate * item.driverQuantityPerMonth) / 3;
      case 'yearly':
        return sum + (item.rate * item.driverQuantityPerMonth) / 12;
      default:
        return sum + item.rate * item.driverQuantityPerMonth;
    }
  }, 0);

  const variableByOffering = summary.variableCostByOffering.map((row) => ({
    ...row,
    offeringName: row.offeringId
      ? normalizedProductService.offerings.find((offering) => offering.id === row.offeringId)?.name ?? row.offeringId
      : 'Shared / All Outputs',
  }));

  const readOnly = !canEdit;

  // --- Cost item row renderer ---

  function renderCostItemRow(item: CostItem, realIndex: number) {
    const monthly = (() => {
      const raw = item.rate * item.driverQuantityPerMonth;
      if (item.driverType === 'quarterly') return raw / 3;
      if (item.driverType === 'yearly') return raw / 12;
      return raw;
    })();

    return (
      <div key={realIndex} className="group grid grid-cols-1 sm:grid-cols-[1fr_100px_160px_100px_80px_40px] gap-3 items-start border-b pb-3 last:border-0 last:pb-0">
        <div>
          <span className="text-xs font-medium text-muted-foreground sm:hidden">Category</span>
          <Input
            value={item.category}
            onChange={(e) => updateCostItem(realIndex, 'category', e.target.value)}
            placeholder="Cost category"
            readOnly={readOnly}
          />
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground sm:hidden">Rate</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              className="pl-7 tabular-nums"
              value={item.rate}
              onChange={(e) => updateCostItem(realIndex, 'rate', Number(e.target.value))}
              readOnly={readOnly}
            />
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground sm:hidden">Driver</span>
          <Select
            value={item.driverType}
            onValueChange={(val) => updateCostItem(realIndex, 'driverType', val)}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRIVER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground sm:hidden">Qty/mo</span>
          <Input
            type="number"
            className="tabular-nums"
            value={item.driverQuantityPerMonth}
            onChange={(e) => updateCostItem(realIndex, 'driverQuantityPerMonth', Number(e.target.value))}
            readOnly={readOnly}
          />
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground sm:hidden">Monthly</span>
          <div className="flex h-9 items-center rounded-md bg-muted px-3 text-sm font-medium tabular-nums">
            {fmt(monthly)}
          </div>
        </div>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="mt-1 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeCostItem(realIndex)}
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>
    );
  }

  const sectionContent = (
    <div className="space-y-6">
      {/* 1. Summary stat cards */}
      <div className="stat-grid">
        <StatCard label="Variable Costs/mo" value={fmtShort(summary.variableMonthlyTotal)} sublabel="component-based by product/service" />
        <StatCard label="Fixed Costs/mo" value={fmtShort(summary.fixedMonthlyTotal)} sublabel="normalized monthly" />
        <StatCard label="Team Costs/mo" value={fmtShort(summary.workforceMonthlyTotal)} sublabel="rate/hour x hours/week x headcount" />
        <StatCard label="Total Operations/mo" value={fmtShort(summary.monthlyOperationsTotal)} sublabel="all costs combined" />
      </div>

      {/* 2. Team section */}
      <Collapsible defaultOpen>
        <SectionHeader title="Team" icon={Users} />
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="flex items-center justify-end">
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={addWorkforceMember}>
                <Plus className="size-4" />
                Add Team Member
              </Button>
            )}
          </div>
          {rawData.workforce.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No team members"
              description="Add team members to calculate workforce costs."
              action={!readOnly ? { label: 'Add Team Member', onClick: addWorkforceMember } : undefined}
            />
          ) : (
            <div className="card-elevated rounded-lg overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="hidden sm:grid grid-cols-[1fr_100px_120px_120px_40px] gap-3 items-center">
                  <span className="text-xs font-medium text-muted-foreground">Role</span>
                  <span className="text-xs font-medium text-muted-foreground">Count</span>
                  <span className="text-xs font-medium text-muted-foreground">Rate/Hour</span>
                  <span className="text-xs font-medium text-muted-foreground">Hours/Week</span>
                  <span />
                </div>
                {rawData.workforce.map((member, index) => (
                  <div
                    key={index}
                    className="group grid grid-cols-1 sm:grid-cols-[1fr_100px_120px_120px_40px] gap-3 items-start border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">Role</span>
                      <Input
                        value={member.role}
                        onChange={(e) => updateWorkforceMember(index, 'role', e.target.value)}
                        placeholder="Role name"
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">Count</span>
                      <Input
                        type="number"
                        className="tabular-nums"
                        value={member.count}
                        onChange={(e) => updateWorkforceMember(index, 'count', Number(e.target.value))}
                        min={1}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">$/hr</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          className="pl-7 tabular-nums"
                          value={member.ratePerHour}
                          onChange={(e) => updateWorkforceMember(index, 'ratePerHour', Number(e.target.value))}
                          step="0.5"
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">Hours/Week</span>
                      <Input
                        type="number"
                        className="tabular-nums"
                        value={member.hoursPerWeek ?? 0}
                        onChange={(e) => updateWorkforceMember(index, 'hoursPerWeek', Number(e.target.value))}
                        min={1}
                        step={1}
                        readOnly={readOnly}
                      />
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="mt-1 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeWorkforceMember(index)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 3. Capacity Mix section */}
      <Collapsible defaultOpen>
        <SectionHeader title="Capacity Mix" icon={Gauge} />
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Define capacity by product/service line and adjust the monthly mix.
            </p>
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={addCapacityItem}>
                <Plus className="size-4" />
                Add Capacity Item
              </Button>
            )}
          </div>
          {capacityItemsWithMix.length === 0 ? (
            <EmptyState
              icon={Gauge}
              title="No capacity items"
              description="Add one or more capacity items for different products or services."
              action={!readOnly ? { label: 'Add Capacity Item', onClick: addCapacityItem } : undefined}
            />
          ) : (
            <div className="space-y-3">
              {capacityItemsWithMix.map((item, index) => {
                const linkedOffering = item.offeringId
                  ? normalizedProductService.offerings.find((o) => o.id === item.offeringId)
                  : null;
                const offeringSelectValue = item.offeringId ?? '__custom__';
                return (
                  <div key={item.id || index} className="group card-elevated rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px_160px_40px] gap-3 items-start">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Capacity Item Name</label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateCapacityItem(index, 'name', e.target.value)}
                          placeholder="e.g. Standard Package, Premium Service, Batch A"
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Linked Offering (optional)</label>
                        <Select
                          value={offeringSelectValue}
                          onValueChange={(value) => {
                            if (value === '__custom__') {
                              unlinkCapacityItemOffering(index);
                              return;
                            }
                            linkCapacityItemToOffering(index, value);
                          }}
                          disabled={readOnly}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Custom / Not linked" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__custom__">Custom / Not linked</SelectItem>
                            {item.offeringId && !linkedOffering && (
                              <SelectItem value={item.offeringId}>
                                Missing offering ({item.offeringId})
                              </SelectItem>
                            )}
                            {normalizedProductService.offerings.map((offering) => (
                              <SelectItem key={offering.id} value={offering.id}>
                                {offering.name || `Offering ${offering.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Output Unit</label>
                        <Input
                          value={item.outputUnitLabel}
                          onChange={(e) => updateCapacityItem(index, 'outputUnitLabel', e.target.value)}
                          placeholder="units / orders / hours"
                          readOnly={readOnly}
                        />
                      </div>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeCapacityItem(index)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Planned / Month</label>
                        <Input
                          type="number"
                          className="tabular-nums"
                          value={item.plannedOutputPerMonth}
                          onChange={(e) => updateCapacityItem(index, 'plannedOutputPerMonth', Number(e.target.value))}
                          min={0}
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Max / Day</label>
                        <Input
                          type="number"
                          className="tabular-nums"
                          value={item.maxOutputPerDay}
                          onChange={(e) => updateCapacityItem(index, 'maxOutputPerDay', Number(e.target.value))}
                          min={0}
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Max / Week</label>
                        <Input
                          type="number"
                          className="tabular-nums"
                          value={item.maxOutputPerWeek}
                          onChange={(e) => updateCapacityItem(index, 'maxOutputPerWeek', Number(e.target.value))}
                          min={0}
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Max / Month</label>
                        <Input
                          type="number"
                          className="tabular-nums"
                          value={item.maxOutputPerMonth}
                          onChange={(e) => updateCapacityItem(index, 'maxOutputPerMonth', Number(e.target.value))}
                          min={0}
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Utilization %</label>
                        <Input
                          type="number"
                          className="tabular-nums"
                          value={item.utilizationRate}
                          onChange={(e) =>
                            updateCapacityItem(
                              index,
                              'utilizationRate',
                              Math.min(100, Math.max(0, Number(e.target.value))),
                            )
                          }
                          min={0}
                          max={100}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        Mix share of planned output
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {item.mixPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {summary.capacityByUnit.length > 0 && (
            <div className="space-y-2">
              {summary.capacityByUnit.map((group) => (
                <div key={group.unitLabel} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Planned/Month ({group.unitLabel})</p>
                    <p className="text-sm font-semibold tabular-nums">{group.totalPlanned.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Max/Month ({group.unitLabel})</p>
                    <p className="text-sm font-semibold tabular-nums">{group.totalMax.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Utilization ({group.unitLabel})</p>
                    <p className="text-sm font-semibold tabular-nums">{group.weightedUtilization.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {summary.variableCostPerOutput > 0 && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
              Variable Cost per planned output ({summary.primaryOutputUnitLabel}): {fmt(summary.variableCostPerOutput)}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 4. Variable Costs section */}
      <Collapsible defaultOpen>
        <SectionHeader title="Variable Costs" icon={DollarSign} />
        <CollapsibleContent className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Define variable cost components per product/service. Components can be sourced in-house, on-demand,
            or via order flows (purchase-order/on-demand) with order fees.
          </p>
          <div className="flex items-center justify-end">
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={addVariableComponent}>
                <Plus className="size-4" />
                Add Component
              </Button>
            )}
          </div>
          {variableComponentsWithCosts.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No variable components"
              description="Add cost components and link them to products/services."
              action={!readOnly ? { label: 'Add Component', onClick: addVariableComponent } : undefined}
            />
          ) : (
            <div className="space-y-3">
              {variableComponentsWithCosts.map(({ component, monthlyCost, index }) => {
                const offeringSelectValue = component.offeringId ?? '__shared__';
                return (
                  <div key={component.id || index} className="group card-elevated rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_190px_180px_40px] gap-3 items-start">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Component</label>
                        <Input
                          value={component.name}
                          onChange={(e) => updateVariableComponent(index, 'name', e.target.value)}
                          placeholder="e.g. Steel plate, Packaging, Cloud API call"
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Product / Service</label>
                        <Select
                          value={offeringSelectValue}
                          onValueChange={(value) => {
                            if (value === '__shared__') {
                              unlinkVariableComponentOffering(index);
                              return;
                            }
                            linkVariableComponentToOffering(index, value);
                          }}
                          disabled={readOnly}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Shared / All outputs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__shared__">Shared / All outputs</SelectItem>
                            {normalizedProductService.offerings.map((offering) => (
                              <SelectItem key={offering.id} value={offering.id}>
                                {offering.name || `Offering ${offering.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Sourcing</label>
                        <Select
                          value={component.sourcingModel}
                          onValueChange={(value) =>
                            updateVariableComponent(index, 'sourcingModel', value as VariableComponentSourcing)}
                          disabled={readOnly}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOURCING_MODEL_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Supplier (optional)</label>
                        <Input
                          value={component.supplier ?? ''}
                          onChange={(e) => updateVariableComponent(index, 'supplier', e.target.value || undefined)}
                          placeholder="Vendor / provider"
                          readOnly={readOnly}
                        />
                      </div>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeVariableComponent(index)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Cost / Component Unit</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            className="pl-7 tabular-nums"
                            value={component.costPerComponentUnit}
                            onChange={(e) => updateVariableComponent(index, 'costPerComponentUnit', Number(e.target.value))}
                            min={0}
                            step="0.01"
                            readOnly={readOnly}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Units / Output</label>
                        <Input
                          type="number"
                          className="tabular-nums"
                          value={component.componentUnitsPerOutput}
                          onChange={(e) => updateVariableComponent(index, 'componentUnitsPerOutput', Number(e.target.value))}
                          min={0}
                          step="0.01"
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Component Unit Label</label>
                        <Input
                          value={component.componentUnitLabel}
                          onChange={(e) => updateVariableComponent(index, 'componentUnitLabel', e.target.value)}
                          placeholder="kg / part / min / call"
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Order Qty (for order flow)</label>
                        <Input
                          type="number"
                          className="tabular-nums"
                          value={component.orderQuantity}
                          onChange={(e) => updateVariableComponent(index, 'orderQuantity', Number(e.target.value))}
                          min={0}
                          readOnly={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Order Fee (for order flow)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <Input
                            type="number"
                            className="pl-7 tabular-nums"
                            value={component.orderFee}
                            onChange={(e) => updateVariableComponent(index, 'orderFee', Number(e.target.value))}
                            min={0}
                            step="0.01"
                            readOnly={readOnly}
                          />
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/50 px-3 py-2">
                        <p className="text-[11px] text-muted-foreground">Monthly Total</p>
                        <p className="text-sm font-semibold tabular-nums">
                          {fmt(monthlyCost?.monthlyTotal ?? 0)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Output Basis / Mo</p>
                        <p className="text-sm font-semibold tabular-nums">
                          {(monthlyCost?.outputBasisPerMonth ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Required Component Units</p>
                        <p className="text-sm font-semibold tabular-nums">
                          {(monthlyCost?.requiredComponentUnits ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Estimated Orders</p>
                        <p className="text-sm font-semibold tabular-nums">
                          {(monthlyCost?.estimatedOrders ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Material + Order Fees</p>
                        <p className="text-sm font-semibold tabular-nums">
                          {fmt((monthlyCost?.monthlyMaterialCost ?? 0) + (monthlyCost?.monthlyOrderCost ?? 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {variableByOffering.length > 0 && (
                <div className="card-elevated rounded-lg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Variable Cost by Product / Service
                  </p>
                  <div className="space-y-2">
                    {variableByOffering.map((row) => (
                      <div key={row.offeringId ?? '__shared__'} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{row.offeringName}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            Output/mo: {row.outputPerMonth.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums">{fmt(row.monthlyVariableTotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                <span className="text-xs text-muted-foreground">Variable Costs Subtotal</span>
                <span className="text-sm font-semibold tabular-nums">
                  {fmt(summary.variableMonthlyTotal)}
                </span>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 5. Fixed Costs section */}
      <Collapsible defaultOpen>
        <SectionHeader title="Fixed Costs" icon={Settings} />
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="flex items-center justify-end">
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={addFixedCostItem}>
                <Plus className="size-4" />
                Add Fixed Cost
              </Button>
            )}
          </div>
          {fixedItems.length === 0 ? (
            <EmptyState
              icon={Settings}
              title="No fixed costs"
              description="Add recurring costs that don't scale with output."
              action={!readOnly ? { label: 'Add Fixed Cost', onClick: addFixedCostItem } : undefined}
            />
          ) : (
            <div className="card-elevated rounded-lg overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="hidden sm:grid grid-cols-[1fr_100px_160px_100px_80px_40px] gap-3 items-center">
                  <span className="text-xs font-medium text-muted-foreground">Category</span>
                  <span className="text-xs font-medium text-muted-foreground">Rate ($)</span>
                  <span className="text-xs font-medium text-muted-foreground">Driver Type</span>
                  <span className="text-xs font-medium text-muted-foreground">Qty/Mo</span>
                  <span className="text-xs font-medium text-muted-foreground">Monthly</span>
                  <span />
                </div>
                {fixedItems.map(({ item, realIndex }) => renderCostItemRow(item, realIndex))}
                <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                  <span className="text-xs text-muted-foreground">Fixed Costs Subtotal (monthly)</span>
                  <span className="text-sm font-semibold tabular-nums">{fmt(fixedSubtotal)}</span>
                </div>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 6. Equipment section */}
      <Collapsible defaultOpen>
        <SectionHeader title="Equipment" icon={Package} />
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="flex items-center justify-end">
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={addEquipment}>
                <Plus className="size-4" />
                Add Item
              </Button>
            )}
          </div>
          {rawData.equipment.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No equipment listed"
              description="Add equipment and tools used in your operations."
              action={!readOnly ? { label: 'Add Equipment', onClick: addEquipment } : undefined}
            />
          ) : (
            <div className="grid gap-2">
              {rawData.equipment.map((item, index) => (
                <div key={index} className="group card-elevated rounded-lg px-4 py-2 flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateEquipment(index, e.target.value)}
                    placeholder="Equipment item"
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                    readOnly={readOnly}
                  />
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeEquipment(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 7. Safety Protocols section */}
      <Collapsible defaultOpen>
        <SectionHeader title="Safety Protocols" icon={ShieldAlert} />
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Safety Notice</p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Define safety protocols relevant to your business operations.
              </p>
            </div>
          </div>
          {rawData.safetyProtocols.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No safety protocols"
              description="Define safety protocols relevant to your operations."
              action={!readOnly ? { label: 'Add Protocol', onClick: addSafetyProtocol } : undefined}
            />
          ) : (
            <div className="space-y-2">
              {!readOnly && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={addSafetyProtocol}>
                    <Plus className="size-4" />
                    Add Protocol
                  </Button>
                </div>
              )}
              {rawData.safetyProtocols.map((protocol, index) => (
                <div key={index} className="group flex items-center gap-2">
                  <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    #{index + 1}
                  </span>
                  <Input
                    value={protocol}
                    onChange={(e) => updateSafetyProtocol(index, e.target.value)}
                    placeholder="Safety protocol"
                    readOnly={readOnly}
                  />
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeSafetyProtocol(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* 8. Operational Metrics section */}
      <Collapsible defaultOpen>
        <SectionHeader title="Operational Metrics" icon={Activity} />
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="flex items-center justify-end">
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={addMetric}>
                <Plus className="size-4" />
                Add Metric
              </Button>
            )}
          </div>
          {rawData.operationalMetrics.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No operational metrics"
              description="Track KPIs like Yield Rate, Scrap Rate, OEE, Utilization."
              action={!readOnly ? { label: 'Add Metric', onClick: addMetric } : undefined}
            />
          ) : (
            <div className="card-elevated rounded-lg overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px_40px] gap-3 items-center">
                  <span className="text-xs font-medium text-muted-foreground">Name</span>
                  <span className="text-xs font-medium text-muted-foreground">Unit</span>
                  <span className="text-xs font-medium text-muted-foreground">Value</span>
                  <span className="text-xs font-medium text-muted-foreground">Target</span>
                  <span />
                </div>
                {rawData.operationalMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="group grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_40px] gap-3 items-start border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">Name</span>
                      <Input
                        value={metric.name}
                        onChange={(e) => updateMetric(index, 'name', e.target.value)}
                        placeholder="Metric name"
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">Unit</span>
                      <Input
                        value={metric.unit}
                        onChange={(e) => updateMetric(index, 'unit', e.target.value)}
                        placeholder="%, units, hours"
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">Value</span>
                      <Input
                        type="number"
                        className="tabular-nums"
                        value={metric.value}
                        onChange={(e) => updateMetric(index, 'value', Number(e.target.value))}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">Target</span>
                      <Input
                        type="number"
                        className="tabular-nums"
                        value={metric.target}
                        onChange={(e) => updateMetric(index, 'target', Number(e.target.value))}
                        readOnly={readOnly}
                      />
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="mt-1 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMetric(index)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader showScenarioBadge sectionSlug="operations" title="Operations" description="Cost structure, team, capacity, and operational details" />
      {sectionContent}
    </div>
  );
}
