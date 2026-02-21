import { useAtom, useAtomValue } from 'jotai';
import { businessVariablesAtom, sectionDerivedScopeAtom } from '@/store/business-atoms.ts';
import { scenarioValuesAtom } from '@/store/scenario-atoms.ts';
import { LEVER_DEFINITIONS, LEVER_CATEGORIES } from './lever-definitions.ts';
import type { LeverDefinition } from './lever-definitions.ts';
import type { VariableDefinition } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { ChevronDown, X } from 'lucide-react';

// --- Helper components ---

interface SliderInputProps {
  label: string;
  value: number;
  baseValue?: number;
  onChange: (value: number) => void;
  onReset?: () => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  displayMultiplier?: number;
  disabled?: boolean;
  isOverridden?: boolean;
}

function SliderInput({
  label,
  value,
  onChange,
  onReset,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  displayMultiplier = 1,
  disabled,
  isOverridden,
}: SliderInputProps) {
  const displayValue = value * displayMultiplier;
  const displayMin = min * displayMultiplier;
  const displayMax = max * displayMultiplier;
  const displayStep = step * displayMultiplier;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {isOverridden && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
            title="Reset to base value"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
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
  onReset?: () => void;
  prefix?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  isOverridden?: boolean;
}

function NumberInput({ label, value, onChange, onReset, prefix, min, max, disabled, isOverridden }: NumberInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {isOverridden && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
            title="Reset to base value"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
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

// --- Render lever control based on unit ---

function renderLeverControl(
  lever: LeverDefinition,
  value: number,
  onChange: (value: number) => void,
  onReset: () => void,
  disabled: boolean | undefined,
  isOverridden: boolean,
  sliderMax: number,
) {
  switch (lever.unit) {
    case 'currency':
      return (
        <NumberInput
          key={lever.id}
          label={lever.label}
          value={value}
          onChange={onChange}
          onReset={onReset}
          prefix="$"
          min={lever.min ?? 0}
          max={lever.max}
          disabled={disabled}
          isOverridden={isOverridden}
        />
      );
    case 'percent':
      return (
        <SliderInput
          key={lever.id}
          label={lever.label}
          value={value}
          onChange={onChange}
          onReset={onReset}
          suffix="%"
          displayMultiplier={100}
          min={lever.min ?? 0}
          max={lever.max ?? 1}
          step={lever.step ?? 0.01}
          disabled={disabled}
          isOverridden={isOverridden}
        />
      );
    case 'count':
      return (
        <SliderInput
          key={lever.id}
          label={lever.label}
          value={value}
          onChange={onChange}
          onReset={onReset}
          min={lever.min ?? 0}
          max={sliderMax}
          step={lever.step ?? 1}
          disabled={disabled}
          isOverridden={isOverridden}
        />
      );
    default:
      return null;
  }
}

// --- Render custom variable control ---

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

// --- Main Component ---

export function DynamicScenarioControls({ disabled }: { disabled?: boolean }) {
  const definitions = useAtomValue(businessVariablesAtom);
  const [values, setValues] = useAtom(scenarioValuesAtom);
  const sectionScope = useAtomValue(sectionDerivedScopeAtom);

  function handleChange(id: string, newValue: number) {
    setValues((prev) => ({ ...prev, [id]: newValue }));
  }

  function handleReset(id: string) {
    setValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  // Filter levers to only those with non-zero base values
  const activeLevers = LEVER_DEFINITIONS.filter((l) => (sectionScope[l.id] ?? 0) > 0);

  // Group levers by category
  const leversByCategory = LEVER_CATEGORIES.map((cat) => ({
    ...cat,
    levers: activeLevers.filter((l) => l.category === cat.key),
  })).filter((group) => group.levers.length > 0);

  // Custom input variables (from businessVariablesAtom, if any)
  const customInputVariables = definitions
    ? Object.values(definitions).filter((v) => v.type === 'input')
    : [];

  const hasLevers = leversByCategory.length > 0;
  const hasCustomVars = customInputVariables.length > 0;

  if (!hasLevers && !hasCustomVars) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No levers available. Fill in your section data (Operations, Financial Projections, KPIs, Marketing) to see adjustable levers here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Levers */}
      {leversByCategory.map((group) => (
        <Card key={group.key}>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">{group.label}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.levers.map((lever) => {
              const baseValue = sectionScope[lever.id] ?? 0;
              const isOverridden = values[lever.id] !== undefined;
              const effectiveValue = isOverridden ? values[lever.id] : baseValue;
              // For count sliders, set a sensible max based on base value
              const sliderMax = lever.max ?? Math.max(baseValue * 3, 100);

              return renderLeverControl(
                lever,
                effectiveValue,
                (newValue) => handleChange(lever.id, newValue),
                () => handleReset(lever.id),
                disabled,
                isOverridden,
                sliderMax,
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Custom Assumptions (input variables) */}
      {hasCustomVars && (
        <Collapsible defaultOpen={!hasLevers}>
          <div className="card-elevated rounded-lg overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 border-b hover:bg-muted/30 transition-colors cursor-pointer">
              <h3 className="text-sm font-semibold">Custom Assumptions</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 space-y-3">
                {customInputVariables.map((variable) => {
                  let effectiveValue = values[variable.id] ?? sectionScope[variable.id] ?? variable.value;
                  if (variable.unit === 'percent' && effectiveValue > 1) {
                    effectiveValue = effectiveValue / 100;
                  }
                  return renderVariableControl(
                    variable,
                    effectiveValue,
                    (newValue) => handleChange(variable.id, newValue),
                    disabled
                  );
                })}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
}
