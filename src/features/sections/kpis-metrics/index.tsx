import { useState } from 'react';
import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import { DEFAULT_KPI_TARGETS } from '@/lib/constants';
import type { KpisMetrics as KpisMetricsType, KpiTargets } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

const defaultKpis: KpisMetricsType = {
  targets: DEFAULT_KPI_TARGETS,
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
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          className={prefix ? 'pl-7' : undefined}
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

function ComparisonBadge({ target, actual, isPercentage }: { target: number; actual: number; isPercentage?: boolean }) {
  if (actual === 0) return null;
  const isGood = actual >= target;
  const formatValue = (v: number) => (isPercentage ? `${Math.round(v * 100)}%` : v.toLocaleString());

  return (
    <span
      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
        isGood
          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
      }`}
    >
      {formatValue(actual)} / {formatValue(target)}
    </span>
  );
}

export function KpisMetrics() {
  const { data, updateData, isLoading } = useSection<KpisMetricsType>(
    'kpis-metrics',
    defaultKpis
  );
  const aiSuggestion = useAiSuggestion<KpisMetricsType>('kpis-metrics');
  const [showActuals, setShowActuals] = useState(!!data.actuals);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">KPIs & Metrics</h1>
        <p className="text-muted-foreground">Loading...</p>
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
      actuals: { ...(prev.actuals ?? { ...DEFAULT_KPI_TARGETS, monthlyLeads: 0, conversionRate: 0, avgCheck: 0, cacPerLead: 0, cacPerBooking: 0, monthlyBookings: 0 }), [field]: value },
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
    <div className="space-y-6">
      {/* Targets Card */}
      <Card>
        <CardHeader>
          <CardTitle>Targets</CardTitle>
          <CardDescription>
            Monthly performance targets for leads, conversion, and revenue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KPI_FIELDS.map((field) => (
              <KpiInput
                key={field.key}
                label={field.label}
                value={displayData.targets[field.key]}
                onChange={(value) => updateTarget(field.key, value)}
                prefix={field.prefix}
                suffix={field.suffix}
                isPercentage={field.isPercentage}
                readOnly={isPreview}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Actuals Card (collapsible) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Track Actuals</CardTitle>
              <CardDescription>
                Track real performance numbers against your targets.
              </CardDescription>
            </div>
            {!isPreview && (
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
        </CardHeader>
        {showActuals && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {KPI_FIELDS.map((field) => (
                <KpiInput
                  key={field.key}
                  label={field.label}
                  value={displayData.actuals?.[field.key] ?? 0}
                  onChange={(value) => updateActual(field.key, value)}
                  prefix={field.prefix}
                  suffix={field.suffix}
                  isPercentage={field.isPercentage}
                  readOnly={isPreview}
                />
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Comparison View */}
      {hasActuals && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>Target vs Actual</CardTitle>
              <CardDescription>
                Green indicates meeting or exceeding target. Red indicates below target.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {KPI_FIELDS.map((field) => {
                  const target = displayData.targets[field.key];
                  const actual = displayData.actuals?.[field.key] ?? 0;

                  // For CAC fields, lower is better (invert comparison)
                  const isCostField = field.key === 'cacPerLead' || field.key === 'cacPerBooking';

                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        {field.label}
                      </label>
                      <ComparisonBadge
                        target={isCostField ? actual : target}
                        actual={isCostField ? target : actual}
                        isPercentage={field.isPercentage}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">KPIs & Metrics</h1>
        <AiActionBar onGenerate={() => aiSuggestion.generate('generate', data)} onImprove={() => aiSuggestion.generate('improve', data)} onExpand={() => aiSuggestion.generate('expand', data)} isLoading={aiSuggestion.state.status === 'loading'} disabled={!isAiAvailable} />
      </div>

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
