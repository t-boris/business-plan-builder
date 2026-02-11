import { useState } from 'react';
import { useSection } from '@/hooks/use-section';
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
import { ChevronDown, ChevronRight } from 'lucide-react';

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
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  isPercentage?: boolean;
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
  const [showActuals, setShowActuals] = useState(!!data.actuals);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">KPIs & Metrics</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
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

  const hasActuals = data.actuals && Object.values(data.actuals).some((v) => v > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">KPIs & Metrics</h1>

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
                value={data.targets[field.key]}
                onChange={(value) => updateTarget(field.key, value)}
                prefix={field.prefix}
                suffix={field.suffix}
                isPercentage={field.isPercentage}
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
            <Button variant="outline" size="sm" onClick={toggleActuals}>
              {showActuals ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              {showActuals ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardHeader>
        {showActuals && (
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {KPI_FIELDS.map((field) => (
                <KpiInput
                  key={field.key}
                  label={field.label}
                  value={data.actuals?.[field.key] ?? 0}
                  onChange={(value) => updateActual(field.key, value)}
                  prefix={field.prefix}
                  suffix={field.suffix}
                  isPercentage={field.isPercentage}
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
                  const target = data.targets[field.key];
                  const actual = data.actuals?.[field.key] ?? 0;

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
}
