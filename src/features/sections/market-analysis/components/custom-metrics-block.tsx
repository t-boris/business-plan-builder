import type { CustomMetric } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface CustomMetricsBlockProps {
  metrics: CustomMetric[];
  onChange: (metrics: CustomMetric[]) => void;
  readOnly: boolean;
}

export function CustomMetricsBlock({ metrics, onChange, readOnly }: CustomMetricsBlockProps) {
  function update(index: number, field: keyof CustomMetric, value: string) {
    const updated = [...metrics];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function add() {
    onChange([...metrics, { label: '', value: '', source: '' }]);
  }

  function remove(index: number) {
    onChange(metrics.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Custom Metrics</h2>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="size-4" />
            Add Metric
          </Button>
        )}
      </div>

      {metrics.length > 0 ? (
        <div className="card-elevated rounded-lg p-5 space-y-2">
          {metrics.map((metric, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
              <div>
                <label className="text-xs text-muted-foreground">Label</label>
                <Input value={metric.label} onChange={(e) => update(i, 'label', e.target.value)} readOnly={readOnly} className="h-8 text-sm" placeholder="e.g. Customer LTV" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Value</label>
                <Input value={metric.value} onChange={(e) => update(i, 'value', e.target.value)} readOnly={readOnly} className="h-8 text-sm" placeholder="e.g. $2,400" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Source</label>
                <Input value={metric.source} onChange={(e) => update(i, 'source', e.target.value)} readOnly={readOnly} className="h-8 text-sm" placeholder="e.g. Internal analysis" />
              </div>
              {!readOnly && (
                <Button variant="ghost" size="icon-xs" onClick={() => remove(i)}>
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No custom metrics added yet.</p>
      )}
    </div>
  );
}
