import { useMemo } from 'react';
import type { AdoptionModel } from '@/types';
import { Input } from '@/components/ui/input';
import { computeAdoption } from '../lib/adoption-math';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AdoptionBlockProps {
  model: AdoptionModel;
  onChange: (model: AdoptionModel) => void;
  readOnly: boolean;
}

export function AdoptionBlock({ model, onChange, readOnly }: AdoptionBlockProps) {
  const data = useMemo(() => computeAdoption(model), [model]);

  function update(field: keyof AdoptionModel, value: string | number) {
    onChange({ ...model, [field]: value });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Adoption Model</h2>

      <div className="card-elevated rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              value={model.type}
              onChange={(e) => update('type', e.target.value as 'linear' | 's-curve')}
              disabled={readOnly}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="s-curve">S-Curve (Logistic)</option>
              <option value="linear">Linear</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Total Market</label>
            <Input type="number" value={model.totalMarket} onChange={(e) => update('totalMarket', Number(e.target.value))} readOnly={readOnly} />
          </div>
          <div>
            <label className="text-sm font-medium">Initial Users</label>
            <Input type="number" value={model.initialUsers} onChange={(e) => update('initialUsers', Number(e.target.value))} readOnly={readOnly} />
          </div>
          <div>
            <label className="text-sm font-medium">Growth Rate</label>
            <Input type="number" step="0.01" value={model.growthRate} onChange={(e) => update('growthRate', Number(e.target.value))} readOnly={readOnly} />
          </div>
          <div>
            <label className="text-sm font-medium">Months</label>
            <Input type="number" value={model.projectionMonths} onChange={(e) => update('projectionMonths', Number(e.target.value))} readOnly={readOnly} />
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} labelFormatter={(l) => `Month ${l}`} />
              <Line type="monotone" dataKey="customers" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
