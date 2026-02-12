import { useAtom } from 'jotai';
import { useAtomValue } from 'jotai';
import { businessVariablesAtom } from '@/store/business-atoms.ts';
import { scenarioValuesAtom } from '@/store/scenario-atoms.ts';
import { VARIABLE_CATEGORIES, type VariableCategory } from '@/lib/variable-templates/types';
import type { VariableDefinition } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// --- Category ordering ---

const CATEGORY_ORDER: VariableCategory[] = (
  Object.entries(VARIABLE_CATEGORIES) as [VariableCategory, { label: string; order: number }][]
)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key]) => key);

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(VARIABLE_CATEGORIES).map(([key, val]) => [key, val.label])
);

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

// --- Helper components ---

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  /** Multiplier for display (e.g. 100 for percentage) */
  displayMultiplier?: number;
  disabled?: boolean;
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  displayMultiplier = 1,
  disabled,
}: SliderInputProps) {
  const displayValue = value * displayMultiplier;
  const displayMin = min * displayMultiplier;
  const displayMax = max * displayMultiplier;
  const displayStep = step * displayMultiplier;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[120px]">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {prefix}
            </span>
          )}
          <Input
            type="number"
            value={displayValue}
            onChange={(e) => onChange(Number(e.target.value) / displayMultiplier)}
            className={`h-8 text-sm text-right ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-7' : ''}`}
            min={displayMin}
            max={displayMax}
            step={displayStep}
            readOnly={disabled}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {suffix}
            </span>
          )}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 cursor-pointer accent-primary"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

function NumberInput({ label, value, onChange, prefix, min, max, disabled }: NumberInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`h-8 text-sm ${prefix ? 'pl-7' : ''}`}
          min={min}
          max={max}
          readOnly={disabled}
        />
      </div>
    </div>
  );
}

// --- Render the appropriate control for a variable ---

function renderVariableControl(
  variable: VariableDefinition,
  value: number,
  onChange: (value: number) => void,
  disabled?: boolean
) {
  switch (variable.unit) {
    case 'currency':
      return (
        <NumberInput
          key={variable.id}
          label={variable.label}
          value={value}
          onChange={onChange}
          prefix="$"
          min={variable.min ?? 0}
          max={variable.max}
          disabled={disabled}
        />
      );
    case 'percent':
      return (
        <SliderInput
          key={variable.id}
          label={variable.label}
          value={value}
          onChange={onChange}
          suffix="%"
          displayMultiplier={100}
          min={variable.min ?? 0}
          max={variable.max ?? 1}
          step={variable.step ?? 0.01}
          disabled={disabled}
        />
      );
    case 'count':
      return (
        <SliderInput
          key={variable.id}
          label={variable.label}
          value={value}
          onChange={onChange}
          min={variable.min ?? 0}
          max={variable.max ?? 100}
          step={variable.step ?? 1}
          disabled={disabled}
        />
      );
    default:
      return (
        <NumberInput
          key={variable.id}
          label={variable.label}
          value={value}
          onChange={onChange}
          min={variable.min}
          max={variable.max}
          disabled={disabled}
        />
      );
  }
}

// --- Main Dynamic Component ---

export function DynamicScenarioControls({ disabled }: { disabled?: boolean }) {
  const definitions = useAtomValue(businessVariablesAtom);
  const [values, setValues] = useAtom(scenarioValuesAtom);

  if (!definitions) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No variables defined. Add variables in the Variables tab.</p>
      </div>
    );
  }

  // Filter to input variables only
  const inputVariables = Object.values(definitions).filter((v) => v.type === 'input');

  if (inputVariables.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No input variables defined. Add variables in the Variables tab.</p>
      </div>
    );
  }

  // Group by category
  const groups: Record<string, VariableDefinition[]> = {};
  for (const v of inputVariables) {
    const cat = v.category || 'operations';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(v);
  }

  // Ordered categories (known categories first, then any unknowns)
  const knownCategories = CATEGORY_ORDER.filter((cat) => groups[cat] && groups[cat].length > 0);
  const unknownCategories = Object.keys(groups)
    .filter((cat) => !CATEGORY_ORDER.includes(cat as VariableCategory))
    .sort();
  const orderedCategories = [...knownCategories, ...unknownCategories];

  function handleChange(variableId: string, newValue: number) {
    setValues((prev) => ({ ...prev, [variableId]: newValue }));
  }

  return (
    <div className="space-y-4">
      {orderedCategories.map((category) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">{getCategoryLabel(category)}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {groups[category].map((variable) =>
              renderVariableControl(
                variable,
                values[variable.id] ?? variable.value,
                (newValue) => handleChange(variable.id, newValue),
                disabled
              )
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
