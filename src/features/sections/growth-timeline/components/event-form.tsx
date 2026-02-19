import { useState, useMemo } from 'react';
import { Parser } from 'expr-eval';
import type { GrowthEvent, GrowthEventType, GrowthEventDelta, CostDriverType, CapacityItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const parser = new Parser();

const EVENT_TYPE_LABELS: Record<GrowthEventType, string> = {
  hire: 'Team Change',
  'cost-change': 'Add/Change Cost',
  'capacity-change': 'Change Capacity',
  'marketing-change': 'Change Marketing Budget',
  custom: 'Custom Adjustment',
  'funding-round': 'Funding Round',
  'facility-build': 'Facility / Build-Out',
  'hiring-campaign': 'Hiring Campaign',
  'price-change': 'Price Change',
  'equipment-purchase': 'Equipment Purchase',
  'seasonal-campaign': 'Seasonal Campaign',
};

const DRIVER_TYPE_LABELS: Record<CostDriverType, string> = {
  'per-unit': 'Per Unit',
  'per-order': 'Per Order',
  'per-service-hour': 'Per Service Hour',
  'per-machine-hour': 'Per Machine Hour',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

function makeDefaultDelta(type: GrowthEventType): GrowthEventDelta {
  switch (type) {
    case 'hire':
      return { type: 'hire', data: { role: '', count: 1, ratePerHour: 0, hoursPerWeek: 40 } };
    case 'cost-change':
      return { type: 'cost-change', data: { category: '', costType: 'fixed', rate: 0, driverType: 'monthly', driverQuantityPerMonth: 1 } };
    case 'capacity-change':
      return { type: 'capacity-change', data: { outputDelta: 0, capacityItemId: undefined } };
    case 'marketing-change':
      return { type: 'marketing-change', data: { monthlyBudget: 0 } };
    case 'custom':
      return { type: 'custom', data: { label: '', value: 0, target: 'revenue', formula: undefined } };
    case 'funding-round':
      return { type: 'funding-round', data: { amount: 0, legalCosts: 0, investmentType: 'equity' } };
    case 'facility-build':
      return { type: 'facility-build', data: { constructionCost: 0, monthlyRent: 0, capacityAdded: 0, capacityItemId: undefined } };
    case 'hiring-campaign':
      return { type: 'hiring-campaign', data: { totalHires: 1, role: '', ratePerHour: 0, hoursPerWeek: 40, recruitingCostPerHire: 0 } };
    case 'price-change':
      return { type: 'price-change', data: { newPricePerUnit: 0 } };
    case 'equipment-purchase':
      return { type: 'equipment-purchase', data: { purchaseCost: 0, capacityIncrease: 0, maintenanceCostMonthly: 0, capacityItemId: undefined } };
    case 'seasonal-campaign':
      return { type: 'seasonal-campaign', data: { budgetIncrease: 0 } };
  }
}

function CustomDeltaFields({
  delta,
  onChange,
}: {
  delta: Extract<GrowthEventDelta, { type: 'custom' }>;
  onChange: (d: GrowthEventDelta) => void;
}) {
  const [formulaInput, setFormulaInput] = useState(delta.data.formula ?? '');

  const formulaResult = useMemo(() => {
    if (!formulaInput.trim()) return null;
    try {
      const val = parser.evaluate(formulaInput);
      return { value: val as number, error: null };
    } catch {
      return { value: null, error: 'Invalid expression' };
    }
  }, [formulaInput]);

  function handleFormulaChange(text: string) {
    setFormulaInput(text);
    try {
      const val = parser.evaluate(text) as number;
      onChange({ ...delta, data: { ...delta.data, value: val, formula: text } });
    } catch {
      onChange({ ...delta, data: { ...delta.data, formula: text || undefined } });
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Custom Label</label>
        <Input
          value={delta.data.label}
          onChange={(e) =>
            onChange({ ...delta, data: { ...delta.data, label: e.target.value } })
          }
          placeholder="e.g. One-time grant"
          className="h-8 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Applies To</label>
        <Select
          value={delta.data.target}
          onValueChange={(v) =>
            onChange({
              ...delta,
              data: {
                ...delta.data,
                target: v as 'revenue' | 'fixedCost' | 'variableCost' | 'marketing',
              },
            })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="fixedCost">Fixed Cost</SelectItem>
            <SelectItem value="variableCost">Variable Cost</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Value ($)</label>
        <Input
          type="number"
          value={delta.data.value}
          onChange={(e) => {
            onChange({ ...delta, data: { ...delta.data, value: Number(e.target.value), formula: undefined } });
            setFormulaInput('');
          }}
          className="h-8 text-sm tabular-nums"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Formula
          {formulaResult?.error && (
            <span className="ml-1 text-destructive">{formulaResult.error}</span>
          )}
          {formulaResult?.value != null && (
            <span className="ml-1 text-emerald-600 dark:text-emerald-400">
              = {formulaResult.value.toLocaleString()}
            </span>
          )}
        </label>
        <Input
          value={formulaInput}
          onChange={(e) => handleFormulaChange(e.target.value)}
          placeholder="e.g. 3000 * 1.2 + 500"
          className="h-8 text-sm font-mono"
        />
      </div>
    </div>
  );
}

const DURATION_TYPES: GrowthEventType[] = ['facility-build', 'hiring-campaign', 'seasonal-campaign'];

interface EventFormProps {
  horizonMonths: number;
  capacityItems?: CapacityItem[];
  initial?: GrowthEvent;
  onSave: (event: GrowthEvent) => void;
  onCancel: () => void;
}

export function EventForm({ horizonMonths, capacityItems = [], initial, onSave, onCancel }: EventFormProps) {
  const isEdit = !!initial;
  const [month, setMonth] = useState(initial?.month ?? 1);
  const [label, setLabel] = useState(initial?.label ?? '');
  const [eventType, setEventType] = useState<GrowthEventType>(initial?.delta.type ?? 'hire');
  const [delta, setDelta] = useState<GrowthEventDelta>(initial?.delta ?? makeDefaultDelta('hire'));
  const [durationMonths, setDurationMonths] = useState(initial?.durationMonths ?? 1);

  function handleTypeChange(type: GrowthEventType) {
    setEventType(type);
    setDelta(makeDefaultDelta(type));
  }

  function handleSave() {
    const event: GrowthEvent = {
      id: initial?.id ?? crypto.randomUUID(),
      month,
      label: label || EVENT_TYPE_LABELS[eventType],
      delta,
      enabled: initial?.enabled ?? true,
      ...(DURATION_TYPES.includes(eventType) ? { durationMonths } : {}),
    };
    onSave(event);
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{isEdit ? 'Edit Event' : 'Add Growth Event'}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Month</label>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: Math.max(horizonMonths, 36) }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  Month {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Event Type</label>
          <Select
            value={eventType}
            onValueChange={(v) => handleTypeChange(v as GrowthEventType)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(EVENT_TYPE_LABELS) as [GrowthEventType, string][]).map(
                ([type, lbl]) => (
                  <SelectItem key={type} value={type}>
                    {lbl}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Label</label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={EVENT_TYPE_LABELS[eventType]}
          className="h-8 text-sm"
        />
      </div>

      {/* Type-specific fields */}
      {delta.type === 'hire' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <Input
              value={delta.data.role}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, role: e.target.value } })
              }
              placeholder="e.g. Engineer"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Count (negative = layoff)</label>
            <Input
              type="number"
              value={delta.data.count}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, count: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Rate/Hour ($)</label>
            <Input
              type="number"
              value={delta.data.ratePerHour}
              onChange={(e) =>
                setDelta({
                  ...delta,
                  data: { ...delta.data, ratePerHour: Number(e.target.value) },
                })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Hours/Week</label>
            <Input
              type="number"
              min={0}
              max={168}
              value={delta.data.hoursPerWeek}
              onChange={(e) =>
                setDelta({
                  ...delta,
                  data: { ...delta.data, hoursPerWeek: Number(e.target.value) },
                })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
        </div>
      )}

      {delta.type === 'cost-change' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Input
              value={delta.data.category}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, category: e.target.value } })
              }
              placeholder="e.g. Hosting"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Cost Type</label>
            <Select
              value={delta.data.costType}
              onValueChange={(v) =>
                setDelta({
                  ...delta,
                  data: { ...delta.data, costType: v as 'variable' | 'fixed' },
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="variable">Variable</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Rate ($ — negative to reduce)</label>
            <Input
              type="number"
              value={delta.data.rate}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, rate: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Driver Type</label>
            <Select
              value={delta.data.driverType}
              onValueChange={(v) =>
                setDelta({
                  ...delta,
                  data: { ...delta.data, driverType: v as CostDriverType },
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(DRIVER_TYPE_LABELS) as [CostDriverType, string][]).map(
                  ([type, lbl]) => (
                    <SelectItem key={type} value={type}>
                      {lbl}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Quantity/Month</label>
            <Input
              type="number"
              min={0}
              value={delta.data.driverQuantityPerMonth}
              onChange={(e) =>
                setDelta({
                  ...delta,
                  data: { ...delta.data, driverQuantityPerMonth: Number(e.target.value) },
                })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
        </div>
      )}

      {delta.type === 'capacity-change' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Product</label>
            <Select
              value={delta.data.capacityItemId ?? '__all__'}
              onValueChange={(v) =>
                setDelta({
                  ...delta,
                  data: { ...delta.data, capacityItemId: v === '__all__' ? undefined : v },
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Products</SelectItem>
                {capacityItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Output Change/Month (+ or -)
            </label>
            <Input
              type="number"
              value={delta.data.outputDelta}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, outputDelta: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
        </div>
      )}

      {delta.type === 'marketing-change' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            New Monthly Budget ($)
          </label>
          <Input
            type="number"
            value={delta.data.monthlyBudget}
            onChange={(e) =>
              setDelta({
                ...delta,
                data: { monthlyBudget: Number(e.target.value) },
              })
            }
            className="h-8 text-sm tabular-nums"
          />
        </div>
      )}

      {delta.type === 'custom' && (
        <CustomDeltaFields
          delta={delta}
          onChange={(d) => setDelta(d)}
        />
      )}

      {/* Duration field for duration-enabled types */}
      {DURATION_TYPES.includes(eventType) && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Duration (months)</label>
          <Input
            type="number"
            min={1}
            value={durationMonths}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
            className="h-8 text-sm tabular-nums"
          />
        </div>
      )}

      {/* Funding Round fields */}
      {delta.type === 'funding-round' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
            <Input
              type="number"
              value={delta.data.amount}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, amount: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Legal Costs ($)</label>
            <Input
              type="number"
              value={delta.data.legalCosts}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, legalCosts: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Investment Type</label>
            <Select
              value={delta.data.investmentType}
              onValueChange={(v) =>
                setDelta({
                  ...delta,
                  data: { ...delta.data, investmentType: v as 'equity' | 'debt' | 'grant' },
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="debt">Debt</SelectItem>
                <SelectItem value="grant">Grant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Facility Build fields */}
      {delta.type === 'facility-build' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Construction Cost ($)</label>
            <Input
              type="number"
              value={delta.data.constructionCost}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, constructionCost: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Monthly Rent After Completion ($)</label>
            <Input
              type="number"
              value={delta.data.monthlyRent}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, monthlyRent: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Capacity Added (units/month)</label>
            <Input
              type="number"
              value={delta.data.capacityAdded}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, capacityAdded: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Product/Service (optional)</label>
            <Select
              value={delta.data.capacityItemId ?? '__all__'}
              onValueChange={(v) =>
                setDelta({
                  ...delta,
                  data: { ...delta.data, capacityItemId: v === '__all__' ? undefined : v },
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Products</SelectItem>
                {capacityItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Hiring Campaign fields */}
      {delta.type === 'hiring-campaign' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Total Hires</label>
            <Input
              type="number"
              value={delta.data.totalHires}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, totalHires: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <Input
              value={delta.data.role}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, role: e.target.value } })
              }
              placeholder="e.g. Sales Rep"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Rate ($/hr)</label>
            <Input
              type="number"
              value={delta.data.ratePerHour}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, ratePerHour: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Hours/Week</label>
            <Input
              type="number"
              value={delta.data.hoursPerWeek}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, hoursPerWeek: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Recruiting Cost per Hire ($)</label>
            <Input
              type="number"
              value={delta.data.recruitingCostPerHire}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, recruitingCostPerHire: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
        </div>
      )}

      {/* Price Change fields */}
      {delta.type === 'price-change' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">New Price per Unit ($)</label>
          <Input
            type="number"
            value={delta.data.newPricePerUnit ?? delta.data.newAvgCheck ?? 0}
            onChange={(e) =>
              setDelta({
                ...delta,
                data: {
                  ...delta.data,
                  newPricePerUnit: Number(e.target.value),
                },
              })
            }
            className="h-8 text-sm tabular-nums"
          />
        </div>
      )}

      {/* Equipment Purchase fields */}
      {delta.type === 'equipment-purchase' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Purchase Cost ($)</label>
            <Input
              type="number"
              value={delta.data.purchaseCost}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, purchaseCost: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Capacity Increase (units/month)</label>
            <Input
              type="number"
              value={delta.data.capacityIncrease}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, capacityIncrease: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Maintenance Cost ($/month)</label>
            <Input
              type="number"
              value={delta.data.maintenanceCostMonthly}
              onChange={(e) =>
                setDelta({ ...delta, data: { ...delta.data, maintenanceCostMonthly: Number(e.target.value) } })
              }
              className="h-8 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Product/Service (optional)</label>
            <Select
              value={delta.data.capacityItemId ?? '__all__'}
              onValueChange={(v) =>
                setDelta({
                  ...delta,
                  data: { ...delta.data, capacityItemId: v === '__all__' ? undefined : v },
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Products</SelectItem>
                {capacityItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Seasonal Campaign fields */}
      {delta.type === 'seasonal-campaign' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Monthly Budget Increase ($)</label>
          <Input
            type="number"
            value={delta.data.budgetIncrease}
            onChange={(e) =>
              setDelta({ ...delta, data: { budgetIncrease: Number(e.target.value) } })
            }
            className="h-8 text-sm tabular-nums"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          {isEdit ? 'Update' : 'Add Event'}
        </Button>
      </div>
    </div>
  );
}
