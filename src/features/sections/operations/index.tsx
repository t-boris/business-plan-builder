import { useState, useEffect } from 'react';
import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { EmptyState } from '@/components/empty-state';
import { normalizeOperations } from './normalize';
import { computeOperationsCosts } from './compute';
import type { Operations as OperationsType, WorkforceMember, CostItem, CostDriverType, OperationalMetric } from '@/types';
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
  AlertCircle,
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

const defaultOperations: OperationsType = {
  workforce: [],
  capacity: {
    outputUnitLabel: '',
    plannedOutputPerMonth: 0,
    maxOutputPerDay: 0,
    maxOutputPerWeek: 0,
    maxOutputPerMonth: 0,
    utilizationRate: 0,
  },
  costItems: [],
  equipment: [],
  safetyProtocols: [],
  operationalMetrics: [],
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
  const aiSuggestion = useAiSuggestion<OperationsType>('operations');

  // Normalize legacy data on first load
  const [normalized, setNormalized] = useState(false);
  useEffect(() => {
    if (!isLoading && !normalized) {
      const norm = normalizeOperations(rawData);
      if (JSON.stringify(norm) !== JSON.stringify(rawData)) {
        updateData(() => norm);
      }
      setNormalized(true);
    }
  }, [isLoading, normalized, rawData, updateData]);

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Operations" description="Loading..." />
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData =
    isPreview && aiSuggestion.state.suggested ? aiSuggestion.state.suggested : rawData;

  const summary = computeOperationsCosts(displayData);

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) updateData(() => suggested);
  }

  // --- Workforce helpers ---

  function addWorkforceMember() {
    updateData((prev) => ({
      ...prev,
      workforce: [...prev.workforce, { role: '', count: 1, ratePerHour: 0 }],
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

  // --- Cost Item helpers ---

  function addCostItem(type: 'variable' | 'fixed') {
    updateData((prev) => ({
      ...prev,
      costItems: [
        ...prev.costItems,
        { category: '', type, rate: 0, driverType: 'monthly' as CostDriverType, driverQuantityPerMonth: 1 },
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

  // --- Derived indexes for variable/fixed cost items ---

  const variableItems = displayData.costItems
    .map((item, realIndex) => ({ item, realIndex }))
    .filter(({ item }) => item.type === 'variable');

  const fixedItems = displayData.costItems
    .map((item, realIndex) => ({ item, realIndex }))
    .filter(({ item }) => item.type === 'fixed');

  const variableSubtotal = variableItems.reduce(
    (sum, { item }) => sum + item.rate * item.driverQuantityPerMonth,
    0,
  );

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

  const readOnly = !canEdit || isPreview;

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
        <StatCard label="Variable Costs/mo" value={fmtShort(summary.variableMonthlyTotal)} sublabel="from cost items" />
        <StatCard label="Fixed Costs/mo" value={fmtShort(summary.fixedMonthlyTotal)} sublabel="normalized monthly" />
        <StatCard label="Team Costs/mo" value={fmtShort(summary.workforceMonthlyTotal)} sublabel="workforce at 160h/mo" />
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
          {displayData.workforce.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No team members"
              description="Add team members to calculate workforce costs."
              action={!readOnly ? { label: 'Add Team Member', onClick: addWorkforceMember } : undefined}
            />
          ) : (
            <div className="card-elevated rounded-lg overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="hidden sm:grid grid-cols-[1fr_100px_120px_40px] gap-3 items-center">
                  <span className="text-xs font-medium text-muted-foreground">Role</span>
                  <span className="text-xs font-medium text-muted-foreground">Count</span>
                  <span className="text-xs font-medium text-muted-foreground">Rate/Hour</span>
                  <span />
                </div>
                {displayData.workforce.map((member, index) => (
                  <div
                    key={index}
                    className="group grid grid-cols-1 sm:grid-cols-[1fr_100px_120px_40px] gap-3 items-start border-b pb-3 last:border-0 last:pb-0"
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

      {/* 3. Capacity section */}
      <Collapsible defaultOpen>
        <SectionHeader title="Capacity" icon={Gauge} />
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Output Unit Label</label>
              <Input
                value={displayData.capacity.outputUnitLabel}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    capacity: { ...prev.capacity, outputUnitLabel: e.target.value },
                  }))
                }
                placeholder="units / bookings / orders"
                readOnly={readOnly}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Planned Output/Month</label>
              <Input
                type="number"
                className="tabular-nums"
                value={displayData.capacity.plannedOutputPerMonth}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    capacity: { ...prev.capacity, plannedOutputPerMonth: Number(e.target.value) },
                  }))
                }
                min={0}
                readOnly={readOnly}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max Output / Day</label>
              <Input
                type="number"
                className="tabular-nums"
                value={displayData.capacity.maxOutputPerDay}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    capacity: { ...prev.capacity, maxOutputPerDay: Number(e.target.value) },
                  }))
                }
                min={0}
                readOnly={readOnly}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max Output / Week</label>
              <Input
                type="number"
                className="tabular-nums"
                value={displayData.capacity.maxOutputPerWeek}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    capacity: { ...prev.capacity, maxOutputPerWeek: Number(e.target.value) },
                  }))
                }
                min={0}
                readOnly={readOnly}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max Output / Month</label>
              <Input
                type="number"
                className="tabular-nums"
                value={displayData.capacity.maxOutputPerMonth}
                onChange={(e) =>
                  updateData((prev) => ({
                    ...prev,
                    capacity: { ...prev.capacity, maxOutputPerMonth: Number(e.target.value) },
                  }))
                }
                min={0}
                readOnly={readOnly}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Utilization Rate</label>
              <div className="relative">
                <Input
                  type="number"
                  className="tabular-nums pr-8"
                  value={displayData.capacity.utilizationRate}
                  onChange={(e) =>
                    updateData((prev) => ({
                      ...prev,
                      capacity: {
                        ...prev.capacity,
                        utilizationRate: Math.min(100, Math.max(0, Number(e.target.value))),
                      },
                    }))
                  }
                  min={0}
                  max={100}
                  readOnly={readOnly}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>
            {summary.variableCostPerOutput > 0 && (
              <div className="flex items-end">
                <div className="flex h-9 items-center rounded-md bg-muted px-3 text-sm font-medium tabular-nums w-full">
                  Variable Cost per {displayData.capacity.outputUnitLabel || 'unit'}: {fmt(summary.variableCostPerOutput)}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 4. Variable Costs section */}
      <Collapsible defaultOpen>
        <SectionHeader title="Variable Costs" icon={DollarSign} />
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="flex items-center justify-end">
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={() => addCostItem('variable')}>
                <Plus className="size-4" />
                Add Variable Cost
              </Button>
            )}
          </div>
          {variableItems.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No variable costs"
              description="Add costs that scale with output volume."
              action={!readOnly ? { label: 'Add Variable Cost', onClick: () => addCostItem('variable') } : undefined}
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
                {variableItems.map(({ item, realIndex }) => renderCostItemRow(item, realIndex))}
                <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                  <span className="text-xs text-muted-foreground">Variable Costs Subtotal</span>
                  <span className="text-sm font-semibold tabular-nums">{fmt(variableSubtotal)}</span>
                </div>
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
              <Button variant="outline" size="sm" onClick={() => addCostItem('fixed')}>
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
              action={!readOnly ? { label: 'Add Fixed Cost', onClick: () => addCostItem('fixed') } : undefined}
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
          {displayData.equipment.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No equipment listed"
              description="Add equipment and tools used in your operations."
              action={!readOnly ? { label: 'Add Equipment', onClick: addEquipment } : undefined}
            />
          ) : (
            <div className="grid gap-2">
              {displayData.equipment.map((item, index) => (
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
          {displayData.safetyProtocols.length === 0 ? (
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
              {displayData.safetyProtocols.map((protocol, index) => (
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
          {displayData.operationalMetrics.length === 0 ? (
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
                {displayData.operationalMetrics.map((metric, index) => (
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
      <PageHeader title="Operations" description="Cost structure, team, capacity, and operational details">
        {canEdit && (
          <AiActionBar
            onGenerate={() => aiSuggestion.generate('generate', rawData)}
            onImprove={() => aiSuggestion.generate('improve', rawData)}
            onExpand={() => aiSuggestion.generate('expand', rawData)}
            isLoading={aiSuggestion.state.status === 'loading'}
            disabled={!isAiAvailable}
          />
        )}
      </PageHeader>

      {aiSuggestion.state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{aiSuggestion.state.error}</span>
          <Button variant="ghost" size="sm" onClick={aiSuggestion.dismiss}>
            Dismiss
          </Button>
        </div>
      )}

      {aiSuggestion.state.status === 'loading' && (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject} isLoading>
          <div />
        </AiSuggestionPreview>
      )}

      {aiSuggestion.state.status === 'preview' ? (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject}>
          {sectionContent}
        </AiSuggestionPreview>
      ) : (
        aiSuggestion.state.status !== 'loading' && sectionContent
      )}
    </div>
  );
}
