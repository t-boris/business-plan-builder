import { useState } from 'react';
import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { PageHeader } from '@/components/page-header';
import type { KpisMetrics as KpisMetricsType, KpiTargets } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2, ArrowDown } from 'lucide-react';

const defaultKpis: KpisMetricsType = {
  targets: { monthlyLeads: 0, conversionRate: 0, avgCheck: 0, cacPerLead: 0, cacPerBooking: 0, monthlyBookings: 0 },
};

const KPI_FIELDS: {
  key: keyof KpiTargets;
  label: string;
  prefix?: string;
  suffix?: string;
  isPercentage?: boolean;
}[] = [
  { key: 'monthlyLeads', label: 'Monthly Leads' },
  { key: 'conversionRate', label: 'Conversion Rate', suffix: '%', isPercentage: true },
  { key: 'avgCheck', label: 'Average Check', prefix: '$' },
  { key: 'cacPerLead', label: 'CAC per Lead', prefix: '$' },
  { key: 'cacPerBooking', label: 'CAC per Booking', prefix: '$' },
  { key: 'monthlyBookings', label: 'Monthly Bookings' },
];

function KpiInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  isPercentage,
  readOnly,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  isPercentage?: boolean;
  readOnly?: boolean;
}) {
  // For percentage: store as decimal (0.2) but display as percentage (20)
  const displayValue = isPercentage ? Math.round(value * 100) : value;

  return (
    <div className="card-elevated rounded-lg p-4">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="relative mt-1">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          className={`tabular-nums ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}`}
          value={displayValue}
          onChange={(e) => {
            const raw = Number(e.target.value);
            onChange(isPercentage ? raw / 100 : raw);
          }}
          readOnly={readOnly}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ComparisonBadge({ target, actual, isPercentage, isCostField }: { target: number; actual: number; isPercentage?: boolean; isCostField?: boolean }) {
  if (actual === 0 && target === 0) return null;
  const isGood = isCostField ? actual <= target : actual >= target;
  const formatValue = (v: number) => (isPercentage ? `${Math.round(v * 100)}%` : v.toLocaleString());

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        isGood
          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
      }`}
    >
      {isGood ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <ArrowDown className="size-3" />
      )}
      {formatValue(actual)} / {formatValue(target)}
    </span>
  );
}

export function KpisMetrics() {
  const { data, updateData, isLoading, canEdit } = useSection<KpisMetricsType>(
    'kpis-metrics',
    defaultKpis
  );
  const aiSuggestion = useAiSuggestion<KpisMetricsType>('kpis-metrics');
  const [showActuals, setShowActuals] = useState(!!data.actuals);

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="KPIs & Metrics" description="Loading..." />
      </div>
    );
  }

  const isPreview = aiSuggestion.state.status === 'preview';
  const displayData = isPreview && aiSuggestion.state.suggested ? aiSuggestion.state.suggested : data;

  function handleAccept() {
    const suggested = aiSuggestion.accept();
    if (suggested) updateData(() => suggested);
  }

  function updateTarget(field: keyof KpiTargets, value: number) {
    updateData((prev) => ({
      ...prev,
      targets: { ...prev.targets, [field]: value },
    }));
  }

  function updateActual(field: keyof KpiTargets, value: number) {
    updateData((prev) => ({
      ...prev,
      actuals: { ...(prev.actuals ?? { monthlyLeads: 0, conversionRate: 0, avgCheck: 0, cacPerLead: 0, cacPerBooking: 0, monthlyBookings: 0 }), [field]: value },
    }));
  }

  function toggleActuals() {
    const next = !showActuals;
    setShowActuals(next);
    if (next && !data.actuals) {
      updateData((prev) => ({
        ...prev,
        actuals: {
          monthlyLeads: 0,
          conversionRate: 0,
          avgCheck: 0,
          cacPerLead: 0,
          cacPerBooking: 0,
          monthlyBookings: 0,
        },
      }));
    }
  }

  const hasActuals = displayData.actuals && Object.values(displayData.actuals).some((v) => v > 0);

  const sectionContent = (
    <div className="page-container">
      {/* Targets */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Targets</h2>
        <p className="text-xs text-muted-foreground">Monthly performance targets for leads, conversion, and revenue.</p>
        <div className="stat-grid">
          {KPI_FIELDS.map((field) => (
            <KpiInput
              key={field.key}
              label={field.label}
              value={displayData.targets[field.key]}
              onChange={(value) => updateTarget(field.key, value)}
              prefix={field.prefix}
              suffix={field.suffix}
              isPercentage={field.isPercentage}
              readOnly={!canEdit || isPreview}
            />
          ))}
        </div>
      </div>

      {/* Actuals (collapsible) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Track Actuals</h2>
          {canEdit && !isPreview && (
            <Button variant="outline" size="sm" onClick={toggleActuals}>
              {showActuals ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              {showActuals ? 'Collapse' : 'Expand'}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Track real performance numbers against your targets.</p>

        <div
          className={`grid transition-all duration-200 ease-in-out ${
            showActuals ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="stat-grid pt-1">
              {KPI_FIELDS.map((field) => (
                <KpiInput
                  key={field.key}
                  label={field.label}
                  value={displayData.actuals?.[field.key] ?? 0}
                  onChange={(value) => updateActual(field.key, value)}
                  prefix={field.prefix}
                  suffix={field.suffix}
                  isPercentage={field.isPercentage}
                  readOnly={!canEdit || isPreview}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison View */}
      {hasActuals && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Target vs Actual</h2>
          <p className="text-xs text-muted-foreground">Green indicates meeting or exceeding target. Amber indicates below target.</p>
          <div className="stat-grid">
            {KPI_FIELDS.map((field) => {
              const target = displayData.targets[field.key];
              const actual = displayData.actuals?.[field.key] ?? 0;
              const isCostField = field.key === 'cacPerLead' || field.key === 'cacPerBooking';

              return (
                <div key={field.key} className="card-elevated rounded-lg p-4 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {field.label}
                  </label>
                  <div>
                    <ComparisonBadge
                      target={target}
                      actual={actual}
                      isPercentage={field.isPercentage}
                      isCostField={isCostField}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="KPIs & Metrics" description="Performance targets, actuals tracking, and comparison dashboard">
        {canEdit && (
          <AiActionBar onGenerate={() => aiSuggestion.generate('generate', data)} onImprove={() => aiSuggestion.generate('improve', data)} onExpand={() => aiSuggestion.generate('expand', data)} isLoading={aiSuggestion.state.status === 'loading'} disabled={!isAiAvailable} />
        )}
      </PageHeader>

      {aiSuggestion.state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" /><span className="flex-1">{aiSuggestion.state.error}</span>
          <Button variant="ghost" size="sm" onClick={aiSuggestion.dismiss}>Dismiss</Button>
        </div>
      )}

      {aiSuggestion.state.status === 'loading' && <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject} isLoading><div /></AiSuggestionPreview>}

      {aiSuggestion.state.status === 'preview' ? (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject}>{sectionContent}</AiSuggestionPreview>
      ) : aiSuggestion.state.status !== 'loading' && sectionContent}
    </div>
  );
}
