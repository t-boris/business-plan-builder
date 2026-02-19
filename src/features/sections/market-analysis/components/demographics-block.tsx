import type { MarketAnalysis, CustomMetric } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Users, DollarSign } from 'lucide-react';

type Demographics = MarketAnalysis['demographics'];

interface DemographicsBlockProps {
  data: Demographics;
  onChange: (data: Demographics) => void;
  readOnly: boolean;
}

export function DemographicsBlock({ data, onChange, readOnly }: DemographicsBlockProps) {
  function updateMetric(index: number, field: keyof CustomMetric, value: string) {
    const metrics = [...data.metrics];
    metrics[index] = { ...metrics[index], [field]: value };
    onChange({ ...data, metrics });
  }

  function addMetric() {
    onChange({ ...data, metrics: [...data.metrics, { label: '', value: '', source: '' }] });
  }

  function removeMetric(index: number) {
    onChange({ ...data, metrics: data.metrics.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Demographics</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card-elevated rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Users className="size-3.5" />
            <span className="text-xs font-medium text-muted-foreground">Population</span>
          </div>
          <p className="text-xl font-bold tabular-nums tracking-tight">
            {data.population > 0 ? data.population.toLocaleString() : '---'}
          </p>
        </div>
        <div className="card-elevated rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <DollarSign className="size-3.5" />
            <span className="text-xs font-medium text-muted-foreground">Median Income</span>
          </div>
          <p className="text-xl font-bold tabular-nums tracking-tight">
            {data.income ? (data.income.match(/\$[\d,]+/)?.[0] ?? data.income) : '---'}
          </p>
        </div>
        {data.metrics.map((m, i) => (
          <div key={i} className="card-elevated rounded-lg p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{m.label || 'Custom Metric'}</span>
            <p className="text-xl font-bold tabular-nums tracking-tight">{m.value || '---'}</p>
            {m.source && <p className="text-xs text-muted-foreground">{m.source}</p>}
          </div>
        ))}
      </div>

      <div className="card-elevated rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Population</label>
            <Input
              type="number"
              value={data.population}
              onChange={(e) => onChange({ ...data, population: Number(e.target.value) })}
              readOnly={readOnly}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Median Income</label>
            <Input
              value={data.income}
              onChange={(e) => onChange({ ...data, income: e.target.value })}
              readOnly={readOnly}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Additional Metrics</label>
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={addMetric}>
                <Plus className="size-4" />
                Add Metric
              </Button>
            )}
          </div>
          {data.metrics.map((metric, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
              <div>
                <label className="text-xs text-muted-foreground">Label</label>
                <Input value={metric.label} onChange={(e) => updateMetric(i, 'label', e.target.value)} readOnly={readOnly} className="h-8 text-sm" placeholder="e.g. Households w/ Kids" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Value</label>
                <Input value={metric.value} onChange={(e) => updateMetric(i, 'value', e.target.value)} readOnly={readOnly} className="h-8 text-sm" placeholder="e.g. 45,000" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Source</label>
                <Input value={metric.source} onChange={(e) => updateMetric(i, 'source', e.target.value)} readOnly={readOnly} className="h-8 text-sm" placeholder="e.g. Census 2024" />
              </div>
              {!readOnly && (
                <Button variant="ghost" size="icon-xs" onClick={() => removeMetric(i)}>
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
