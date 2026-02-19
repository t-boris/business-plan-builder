import { useMemo } from 'react';
import type { MarketSizing, CalcStep, SizingApproach } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { AiFieldTrigger } from '@/components/ai-field-trigger';
import { formatTam } from '../lib/format-helpers';
import { computeTam, computeSam, computeSom, isCurrencyResult, isPureFilter } from '../lib/sizing-math';
import { TOP_DOWN_TAM_STEPS, BOTTOM_UP_TAM_STEPS } from '../defaults';

interface SizingBlockProps {
  sizing: MarketSizing;
  narrative: string;
  onChange: (sizing: MarketSizing) => void;
  onNarrativeChange: (value: string) => void;
  readOnly: boolean;
  sectionData?: Record<string, unknown>;
}

const STEP_TYPE_LABELS: Record<CalcStep['type'], string> = {
  currency: 'Currency ($)',
  percentage: 'Percent (%)',
  count: 'Count (#)',
};

const APPROACH_LABELS: Record<SizingApproach, string> = {
  'top-down': 'Top-down',
  'bottom-up': 'Bottom-up',
  custom: 'Custom',
};

/**
 * When a step is changed to 'count' and no currency step exists,
 * auto-append a price step so the result is always in dollars.
 */
function ensureCurrencyStep(steps: CalcStep[]): CalcStep[] {
  if (isCurrencyResult(steps)) return steps;
  if (!steps.some((s) => s.type === 'count')) return steps;
  return [...steps, { label: 'Expected price per unit', value: 0, type: 'currency' }];
}

function StepRow({
  step,
  running,
  onUpdate,
  onRemove,
  readOnly,
  canRemove,
}: {
  step: CalcStep;
  running: RunningEntry;
  onUpdate: (s: CalcStep) => void;
  onRemove: () => void;
  readOnly: boolean;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={step.label}
        onChange={(e) => onUpdate({ ...step, label: e.target.value })}
        readOnly={readOnly}
        className="h-8 text-sm flex-1 min-w-0"
        placeholder="Step label"
      />
      <Input
        type="number"
        value={step.value || ''}
        onChange={(e) => onUpdate({ ...step, value: Number(e.target.value) })}
        readOnly={readOnly}
        className="h-8 text-sm w-28 tabular-nums text-right"
        placeholder="0"
        min={0}
        max={step.type === 'percentage' ? 100 : undefined}
      />
      <Select
        value={step.type}
        onValueChange={(v) => onUpdate({ ...step, type: v as CalcStep['type'] })}
        disabled={readOnly}
      >
        <SelectTrigger className="h-8 text-sm w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STEP_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="w-20 text-right text-xs tabular-nums text-muted-foreground shrink-0 truncate" title={running.value > 0 ? (running.isCurrency ? formatTam(running.value) : formatCount(running.value)) : ''}>
        {running.value > 0 ? `= ${running.isCurrency ? formatTam(running.value) : formatCount(running.value)}` : ''}
      </span>
      {!readOnly && canRemove && (
        <Button variant="ghost" size="icon-xs" onClick={onRemove} className="shrink-0">
          <Trash2 className="size-3.5 text-muted-foreground" />
        </Button>
      )}
      {/* Invisible spacer when no trash button, to keep alignment */}
      {(readOnly || !canRemove) && <div className="w-6 shrink-0" />}
    </div>
  );
}

interface RunningEntry {
  value: number;
  isCurrency: boolean;
}

function computeRunningTotals(steps: CalcStep[], baseValue: number, baseIsCurrency: boolean): RunningEntry[] {
  const totals: RunningEntry[] = [];
  let running = baseValue;
  let hasCurrency = baseIsCurrency;
  for (const step of steps) {
    if (step.type === 'currency') hasCurrency = true;
    if (step.type === 'percentage') {
      running *= step.value / 100;
    } else {
      running *= step.value;
    }
    totals.push({ value: running, isCurrency: hasCurrency });
  }
  return totals;
}

/** Format a non-currency number (count/unitless) */
function formatCount(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toFixed(1);
}

function SizingSection({
  title,
  subtitle,
  startingFrom,
  baseValue,
  baseIsCurrency,
  steps,
  computedTotal,
  onUpdateStep,
  onAddStep,
  onRemoveStep,
  readOnly,
  color,
  borderColor,
  children,
}: {
  title: string;
  subtitle: string;
  startingFrom?: string;
  baseValue: number;
  baseIsCurrency: boolean;
  steps: CalcStep[];
  computedTotal: number;
  onUpdateStep: (index: number, step: CalcStep) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  readOnly: boolean;
  color: string;
  borderColor: string;
  children?: React.ReactNode;
}) {
  const runningTotals = useMemo(() => computeRunningTotals(steps, baseValue, baseIsCurrency), [steps, baseValue, baseIsCurrency]);

  return (
    <div className={`card-elevated rounded-lg p-5 space-y-3 border-l-2 ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${color}`}>
          <TrendingUp className="size-4" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>

      {children}

      {startingFrom && (
        <p className="text-xs text-muted-foreground">
          Starting from {startingFrom}
        </p>
      )}

      {/* Step rows */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium px-0">
          <span className="flex-1 min-w-0">Label</span>
          <span className="w-28 text-right">Value</span>
          <span className="w-32">Type</span>
          <span className="w-20 text-right">Running</span>
          <span className="w-6" />
        </div>
        {steps.map((step, i) => (
          <StepRow
            key={i}
            step={step}
            running={runningTotals[i] ?? { value: 0, isCurrency: false }}
            onUpdate={(s) => onUpdateStep(i, s)}
            onRemove={() => onRemoveStep(i)}
            readOnly={readOnly}
            canRemove={steps.length > 1}
          />
        ))}
      </div>

      {!readOnly && (
        <Button variant="outline" size="sm" onClick={onAddStep} className="text-xs">
          <Plus className="size-3.5" />
          Add Step
        </Button>
      )}

      <div className="border-t pt-2">
        <p className="text-lg font-bold tabular-nums tracking-tight">
          {computedTotal > 0 ? formatTam(computedTotal) : '---'}
        </p>
      </div>
    </div>
  );
}

/** Concentric circles SVG visualization for TAM > SAM > SOM */
function ConcentricCircles({ tam, sam, som }: { tam: number; sam: number; som: number }) {
  if (tam <= 0) return null;
  const maxR = 90;
  const samR = sam > 0 ? Math.max(Math.sqrt(sam / tam) * maxR, 20) : 0;
  const somR = som > 0 ? Math.max(Math.sqrt(som / tam) * maxR, 10) : 0;
  const cx = 120;
  const cy = 110;

  return (
    <div className="flex justify-center">
      <svg width="240" height="220" viewBox="0 0 240 220">
        {/* TAM */}
        <circle cx={cx} cy={cy} r={maxR} fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="2" />
        <text x={cx} y={cy - maxR + 16} textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400" fontSize="11" fontWeight="600">TAM {formatTam(tam)}</text>

        {/* SAM */}
        {samR > 0 && (
          <>
            <circle cx={cx} cy={cy} r={samR} fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
            <text x={cx} y={cy - samR + 14} textAnchor="middle" className="fill-blue-600 dark:fill-blue-400" fontSize="10" fontWeight="600">SAM {formatTam(sam)}</text>
          </>
        )}

        {/* SOM */}
        {somR > 0 && (
          <>
            <circle cx={cx} cy={cy} r={somR} fill="rgba(99, 102, 241, 0.2)" stroke="rgba(99, 102, 241, 0.6)" strokeWidth="2" />
            <text x={cx} y={cy + 4} textAnchor="middle" className="fill-indigo-600 dark:fill-indigo-400" fontSize="9" fontWeight="600">SOM {formatTam(som)}</text>
          </>
        )}
      </svg>
    </div>
  );
}

export function SizingBlock({ sizing, narrative, onChange, onNarrativeChange, readOnly, sectionData }: SizingBlockProps) {
  const tamTotal = useMemo(() => computeTam(sizing.tam), [sizing.tam]);
  const samTotal = useMemo(() => computeSam(sizing.tam, sizing.sam), [sizing.tam, sizing.sam]);
  const somTotal = useMemo(() => computeSom(sizing.tam, sizing.sam, sizing.som), [sizing.tam, sizing.sam, sizing.som]);
  const samIsFilter = isPureFilter(sizing.sam.steps);
  const somIsFilter = isPureFilter(sizing.som.steps);

  function handleApproachChange(approach: SizingApproach) {
    let steps: CalcStep[];
    if (approach === 'top-down') {
      steps = [...TOP_DOWN_TAM_STEPS];
    } else if (approach === 'bottom-up') {
      steps = [...BOTTOM_UP_TAM_STEPS];
    } else {
      // Custom — keep current steps
      steps = [...sizing.tam.steps];
    }
    onChange({ ...sizing, tam: { approach, steps } });
  }

  function updateTamStep(index: number, step: CalcStep) {
    const steps = [...sizing.tam.steps];
    steps[index] = step;
    // If user changed type to count and no currency step exists, auto-add price step
    onChange({ ...sizing, tam: { ...sizing.tam, steps: ensureCurrencyStep(steps) } });
  }

  function addTamStep() {
    onChange({
      ...sizing,
      tam: { ...sizing.tam, steps: [...sizing.tam.steps, { label: '', value: 0, type: 'percentage' }] },
    });
  }

  function removeTamStep(index: number) {
    const steps = sizing.tam.steps.filter((_, i) => i !== index);
    onChange({
      ...sizing,
      tam: { ...sizing.tam, steps },
    });
  }

  function updateSamStep(index: number, step: CalcStep) {
    const steps = [...sizing.sam.steps];
    steps[index] = step;
    onChange({ ...sizing, sam: { steps } });
  }

  function addSamStep() {
    onChange({
      ...sizing,
      sam: { steps: [...sizing.sam.steps, { label: '', value: 0, type: 'percentage' }] },
    });
  }

  function removeSamStep(index: number) {
    onChange({
      ...sizing,
      sam: { steps: sizing.sam.steps.filter((_, i) => i !== index) },
    });
  }

  function updateSomStep(index: number, step: CalcStep) {
    const steps = [...sizing.som.steps];
    steps[index] = step;
    onChange({ ...sizing, som: { steps } });
  }

  function addSomStep() {
    onChange({
      ...sizing,
      som: { steps: [...sizing.som.steps, { label: '', value: 0, type: 'percentage' }] },
    });
  }

  function removeSomStep(index: number) {
    onChange({
      ...sizing,
      som: { steps: sizing.som.steps.filter((_, i) => i !== index) },
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Market Sizing (TAM / SAM / SOM)</h2>

      <div className="space-y-4">
        {/* TAM */}
        <SizingSection
          title="TAM: Total Addressable Market"
          subtitle="Product of all steps"
          baseValue={1}
          baseIsCurrency={false}
          steps={sizing.tam.steps}
          computedTotal={tamTotal}
          onUpdateStep={updateTamStep}
          onAddStep={addTamStep}
          onRemoveStep={removeTamStep}
          readOnly={readOnly}
          color="text-emerald-600 dark:text-emerald-400"
          borderColor="border-l-emerald-500"
        >
          {!readOnly && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Approach:</span>
              <Select
                value={sizing.tam.approach}
                onValueChange={(v) => handleApproachChange(v as SizingApproach)}
                disabled={readOnly}
              >
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPROACH_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {readOnly && (
            <p className="text-xs text-muted-foreground">Approach: {APPROACH_LABELS[sizing.tam.approach]}</p>
          )}
        </SizingSection>

        {/* SAM */}
        <SizingSection
          title="SAM: Serviceable Addressable Market"
          subtitle={samIsFilter ? 'TAM × filter steps' : 'Standalone calculation'}
          startingFrom={samIsFilter && tamTotal > 0 ? `TAM: ${formatTam(tamTotal)}` : undefined}
          baseValue={samIsFilter ? tamTotal : 1}
          baseIsCurrency={samIsFilter}
          steps={sizing.sam.steps}
          computedTotal={samTotal}
          onUpdateStep={updateSamStep}
          onAddStep={addSamStep}
          onRemoveStep={removeSamStep}
          readOnly={readOnly}
          color="text-blue-600 dark:text-blue-400"
          borderColor="border-l-blue-500"
        />

        {/* SOM */}
        <SizingSection
          title="SOM: Serviceable Obtainable Market"
          subtitle={somIsFilter ? 'SAM × capture steps' : 'Standalone calculation'}
          startingFrom={somIsFilter && samTotal > 0 ? `SAM: ${formatTam(samTotal)}` : undefined}
          baseValue={somIsFilter ? samTotal : 1}
          baseIsCurrency={somIsFilter}
          steps={sizing.som.steps}
          computedTotal={somTotal}
          onUpdateStep={updateSomStep}
          onAddStep={addSomStep}
          onRemoveStep={removeSomStep}
          readOnly={readOnly}
          color="text-indigo-600 dark:text-indigo-400"
          borderColor="border-l-indigo-500"
        />
      </div>

      <ConcentricCircles tam={tamTotal} sam={samTotal} som={somTotal} />

      <div>
        <label className="text-sm font-medium flex items-center gap-1">
          Market Narrative
          {!readOnly && sectionData && (
            <AiFieldTrigger
              fieldName="marketNarrative"
              fieldLabel="Market Narrative"
              currentValue={narrative}
              sectionSlug="market-analysis"
              sectionData={sectionData}
              onResult={(val) => onNarrativeChange(val)}
            />
          )}
        </label>
        <Textarea
          value={narrative}
          onChange={(e) => onNarrativeChange(e.target.value)}
          rows={3}
          readOnly={readOnly}
          placeholder="Describe the market opportunity, trends, and your positioning..."
        />
      </div>
    </div>
  );
}
