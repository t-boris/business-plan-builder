import { useState, useMemo } from 'react';
import { Calculator, X, Plus, ChevronDown } from 'lucide-react';
import { useBusinessVariables } from '@/hooks/use-business-variables';
import { evaluateVariables } from '@/lib/formula-engine';
import { VARIABLE_CATEGORIES, type VariableCategory } from '@/lib/variable-templates/types';
import type { VariableDefinition, VariableUnit } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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

// --- Formatting ---

function formatValue(value: number, unit: VariableUnit): string {
  if (unit === 'currency')
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  if (unit === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (unit === 'ratio') return value.toFixed(2);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

// --- Category ordering ---

const CATEGORY_ORDER: VariableCategory[] = (
  Object.entries(VARIABLE_CATEGORIES) as [VariableCategory, { label: string; order: number }][]
)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key]) => key);

// --- Add Variable Form ---

const UNIT_OPTIONS: { value: VariableUnit; label: string }[] = [
  { value: 'currency', label: 'Currency ($)' },
  { value: 'percent', label: 'Percent (%)' },
  { value: 'count', label: 'Count' },
  { value: 'ratio', label: 'Ratio' },
  { value: 'months', label: 'Months' },
  { value: 'days', label: 'Days' },
  { value: 'hours', label: 'Hours' },
];

interface AddVariableFormData {
  id: string;
  label: string;
  type: 'input' | 'computed';
  category: VariableCategory;
  unit: VariableUnit;
  formula: string;
  dependsOn: string;
}

const INITIAL_FORM: AddVariableFormData = {
  id: '',
  label: '',
  type: 'input',
  category: 'revenue',
  unit: 'currency',
  formula: '',
  dependsOn: '',
};

function AddVariableForm({
  onAdd,
  existingIds,
}: {
  onAdd: (v: VariableDefinition) => void;
  existingIds: string[];
}) {
  const [form, setForm] = useState<AddVariableFormData>({ ...INITIAL_FORM });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id.trim() || !form.label.trim()) return;
    if (existingIds.includes(form.id.trim())) return;

    const newVar: VariableDefinition = {
      id: form.id.trim(),
      label: form.label.trim(),
      type: form.type,
      category: form.category,
      unit: form.unit,
      value: 0,
      defaultValue: 0,
    };

    if (form.type === 'computed' && form.formula.trim()) {
      newVar.formula = form.formula.trim();
      newVar.dependsOn = form.dependsOn
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    onAdd(newVar);
    setForm({ ...INITIAL_FORM });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">ID</label>
          <Input
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="variableId"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Label</label>
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Display Name"
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v as 'input' | 'computed' })}
          >
            <SelectTrigger className="h-8 text-sm w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="input">Input</SelectItem>
              <SelectItem value="computed">Computed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v as VariableCategory })}
          >
            <SelectTrigger className="h-8 text-sm w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ORDER.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {VARIABLE_CATEGORIES[cat].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Unit</label>
          <Select
            value={form.unit}
            onValueChange={(v) => setForm({ ...form, unit: v as VariableUnit })}
          >
            <SelectTrigger className="h-8 text-sm w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.type === 'computed' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Formula</label>
            <Input
              value={form.formula}
              onChange={(e) => setForm({ ...form, formula: e.target.value })}
              placeholder="e.g. price * quantity"
              className="h-8 text-sm font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Depends On (comma-separated IDs)
            </label>
            <Input
              value={form.dependsOn}
              onChange={(e) => setForm({ ...form, dependsOn: e.target.value })}
              placeholder="e.g. price, quantity"
              className="h-8 text-sm font-mono"
            />
          </div>
        </div>
      )}

      <Button type="submit" size="sm" variant="outline" className="w-full">
        <Plus className="size-3" />
        Add Variable
      </Button>
    </form>
  );
}

// --- Main Component ---

export function VariableEditor() {
  const { variables, updateVariableValue, addVariable, removeVariable } =
    useBusinessVariables();

  // Evaluate all variables
  const { evaluatedValues, evaluationError } = useMemo(() => {
    if (!variables || Object.keys(variables).length === 0)
      return { evaluatedValues: {} as Record<string, number>, evaluationError: null };
    try {
      const result = evaluateVariables(variables);
      return { evaluatedValues: result, evaluationError: null };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      // Return input values only so inputs remain editable
      const inputValues: Record<string, number> = {};
      for (const v of Object.values(variables)) {
        if (v.type === 'input') {
          inputValues[v.id] = v.value;
        }
      }
      return { evaluatedValues: inputValues, evaluationError: error };
    }
  }, [variables]);

  // Group variables by category
  const categorized = useMemo(() => {
    if (!variables) return [];
    const groups: Record<string, VariableDefinition[]> = {};

    for (const v of Object.values(variables)) {
      const cat = v.category || 'operations';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    }

    // Return in category order, only categories with variables
    return CATEGORY_ORDER.filter((cat) => groups[cat] && groups[cat].length > 0).map(
      (cat) => ({
        key: cat,
        label: VARIABLE_CATEGORIES[cat]?.label ?? cat,
        variables: groups[cat],
      })
    );
  }, [variables]);

  // Empty state
  if (!variables || Object.keys(variables).length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No variables configured for this business.</p>
      </div>
    );
  }

  function handleInputChange(variable: VariableDefinition, rawValue: string) {
    const parsed = parseFloat(rawValue);
    if (isNaN(parsed)) return;
    // For percent display: user enters 30 meaning 30%, store as 0.30
    const valueToStore = variable.unit === 'percent' ? parsed / 100 : parsed;
    updateVariableValue(variable.id, valueToStore);
  }

  return (
    <div className="space-y-4">
      {/* Error alert */}
      {evaluationError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <strong>Formula Error:</strong> {evaluationError}
        </div>
      )}

      {/* Variable categories */}
      {categorized.map((group) => (
        <Card key={group.key}>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">{group.label}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.variables.map((variable) => {
              if (variable.type === 'input') {
                const displayValue =
                  variable.unit === 'percent'
                    ? (variable.value * 100).toFixed(1)
                    : String(variable.value);

                return (
                  <div key={variable.id} className="group flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <label
                        className="text-xs font-medium text-muted-foreground"
                        title={variable.description}
                      >
                        {variable.label}
                      </label>
                      <div className="relative">
                        {variable.unit === 'currency' && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            $
                          </span>
                        )}
                        <Input
                          type="number"
                          value={displayValue}
                          onChange={(e) => handleInputChange(variable, e.target.value)}
                          className={`h-8 text-sm ${variable.unit === 'currency' ? 'pl-7' : ''} ${variable.unit === 'percent' ? 'pr-7' : ''}`}
                          step={variable.step ?? (variable.unit === 'percent' ? 0.1 : 1)}
                          min={
                            variable.min !== undefined
                              ? variable.unit === 'percent'
                                ? variable.min * 100
                                : variable.min
                              : undefined
                          }
                          max={
                            variable.max !== undefined
                              ? variable.unit === 'percent'
                                ? variable.max * 100
                                : variable.max
                              : undefined
                          }
                        />
                        {variable.unit === 'percent' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            %
                          </span>
                        )}
                      </div>
                      {variable.description && (
                        <p className="text-[10px] text-muted-foreground/70">
                          {variable.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-4"
                      onClick={() => removeVariable(variable.id)}
                      title="Remove variable"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                );
              }

              // Computed variable
              const computedValue = evaluatedValues[variable.id] ?? 0;
              return (
                <div key={variable.id} className="group flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <label
                      className="text-xs font-medium text-muted-foreground"
                      title={variable.description}
                    >
                      {variable.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatValue(computedValue, variable.unit)}
                      </span>
                      {variable.formula && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60 cursor-help"
                          title={variable.formula}
                        >
                          <Calculator className="size-3" />
                          <span>fx</span>
                        </span>
                      )}
                    </div>
                    {variable.description && (
                      <p className="text-[10px] text-muted-foreground/70">
                        {variable.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-4"
                    onClick={() => removeVariable(variable.id)}
                    title="Remove variable"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Add Variable */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="size-3" />
            Add Variable
            <ChevronDown className="size-3 ml-auto transition-transform data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="pt-4">
              <AddVariableForm
                onAdd={addVariable}
                existingIds={Object.keys(variables)}
              />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
