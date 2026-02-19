import type { Competitor } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { parsePriceRange } from '../lib/format-helpers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = ['var(--chart-profit)', 'var(--chart-neutral)'];

interface CompetitorsBlockProps {
  competitors: Competitor[];
  onUpdate: (index: number, field: keyof Competitor, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  readOnly: boolean;
}

export function CompetitorsBlock({ competitors, onUpdate, onAdd, onRemove, readOnly }: CompetitorsBlockProps) {
  const chartData = competitors
    .map((c) => {
      const range = parsePriceRange(c.pricing);
      if (!range) return null;
      return { name: c.name, min: range[0], max: range[1] };
    })
    .filter((d): d is { name: string; min: number; max: number } => d !== null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Competitors</h2>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            Add Competitor
          </Button>
        )}
      </div>

      <div className="card-elevated rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-[100px]">Pricing</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Strengths</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Weaknesses</th>
              {!readOnly && <th className="w-[40px]" />}
            </tr>
          </thead>
          <tbody>
            {competitors.map((competitor, index) => (
              <tr key={index} className="border-b last:border-0 even:bg-muted/15">
                <td className="px-4 py-2 align-top">
                  <Textarea value={competitor.name} onChange={(e) => onUpdate(index, 'name', e.target.value)} placeholder="Competitor name" readOnly={readOnly} className="min-h-8 text-sm py-1.5" />
                </td>
                <td className="px-4 py-2 align-top">
                  <Textarea value={competitor.pricing} onChange={(e) => onUpdate(index, 'pricing', e.target.value)} placeholder="$XXX-$XXX" readOnly={readOnly} className="min-h-8 text-sm py-1.5" />
                </td>
                <td className="px-4 py-2 hidden sm:table-cell align-top">
                  <Textarea value={competitor.strengths} onChange={(e) => onUpdate(index, 'strengths', e.target.value)} placeholder="Key strengths" readOnly={readOnly} className="min-h-8 text-sm py-1.5" />
                </td>
                <td className="px-4 py-2 hidden sm:table-cell align-top">
                  <Textarea value={competitor.weaknesses} onChange={(e) => onUpdate(index, 'weaknesses', e.target.value)} placeholder="Key weaknesses" readOnly={readOnly} className="min-h-8 text-sm py-1.5" />
                </td>
                {!readOnly && (
                  <td className="px-2 py-2">
                    <Button variant="ghost" size="icon-xs" onClick={() => onRemove(index)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {competitors.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No competitors added yet.</p>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="card-elevated rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Competitor Pricing</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="min" fill={CHART_COLORS[1]} name="Min Price" radius={[0, 0, 0, 0]} />
                <Bar dataKey="max" fill={CHART_COLORS[0]} name="Max Price" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
