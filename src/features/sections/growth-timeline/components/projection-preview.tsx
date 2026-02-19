import { StatCard } from '@/components/stat-card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { GrowthComputeResult } from '../compute';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

interface ProjectionPreviewProps {
  result: GrowthComputeResult;
  horizonMonths: number;
}

export function ProjectionPreview({ result, horizonMonths }: ProjectionPreviewProps) {
  const { months, summary } = result;

  const chartData = months.map((snap) => ({
    month: `M${snap.month}`,
    Revenue: Math.round(snap.revenue),
    Costs: Math.round(snap.totalCost),
    Profit: Math.round(snap.profit),
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Projected Impact ({horizonMonths} months)
      </h2>

      {/* Summary Stats */}
      <div className="stat-grid">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          trend={summary.totalRevenue > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          label="Total Costs"
          value={formatCurrency(summary.totalCosts)}
        />
        <StatCard
          label="Total Profit"
          value={formatCurrency(summary.totalProfit)}
          trend={summary.totalProfit >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Break-Even"
          value={summary.breakEvenMonth ? `Month ${summary.breakEvenMonth}` : 'N/A'}
          sublabel={summary.breakEvenMonth ? 'cumulative profit >= 0' : 'not reached in horizon'}
          trend={summary.breakEvenMonth ? 'up' : 'neutral'}
        />
      </div>

      {/* Area Chart */}
      <div className="card-elevated rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Revenue vs Costs vs Profit</h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} labelStyle={{ fontWeight: 600 }} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="var(--chart-revenue)"
                fill="var(--chart-revenue)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Costs"
                stroke="var(--chart-cost)"
                fill="var(--chart-cost)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Profit"
                stroke="var(--chart-profit)"
                fill="var(--chart-profit)"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Snapshots Table */}
      <div className="card-elevated rounded-lg overflow-hidden">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold">Monthly Snapshots</h3>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-2 px-2 text-left text-xs font-medium text-muted-foreground uppercase">Month</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Team</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Output</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Revenue</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Labor</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Variable</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Fixed</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Marketing</th>
                <th className="py-2 px-2 text-right text-xs font-medium text-muted-foreground uppercase">Profit</th>
              </tr>
            </thead>
            <tbody>
              {months.map((snap) => {
                const teamSize = snap.workforce.reduce((s, w) => s + w.count, 0);
                return (
                  <tr key={snap.month} className={`border-b last:border-b-0 ${snap.profit >= 0 ? '' : 'bg-red-50/50 dark:bg-red-950/10'}`}>
                    <td className="py-1.5 px-2 text-xs font-medium">{snap.label}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{teamSize}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{snap.plannedOutput}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums text-green-600">{formatCurrency(snap.revenue)}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{formatCurrency(snap.workforceCost)}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{formatCurrency(snap.variableCost)}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{formatCurrency(snap.fixedCost)}</td>
                    <td className="py-1.5 px-2 text-right text-xs tabular-nums">{formatCurrency(snap.marketingBudget)}</td>
                    <td className={`py-1.5 px-2 text-right text-xs font-semibold tabular-nums ${snap.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(snap.profit)}
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="border-t-2 font-semibold">
                <td className="py-2 px-2 text-xs uppercase">Total</td>
                <td className="py-2 px-2" />
                <td className="py-2 px-2" />
                <td className="py-2 px-2 text-right text-xs text-green-600 tabular-nums">{formatCurrency(summary.totalRevenue)}</td>
                <td className="py-2 px-2 text-right text-xs tabular-nums">{formatCurrency(months.reduce((s, m) => s + m.workforceCost, 0))}</td>
                <td className="py-2 px-2 text-right text-xs tabular-nums">{formatCurrency(months.reduce((s, m) => s + m.variableCost, 0))}</td>
                <td className="py-2 px-2 text-right text-xs tabular-nums">{formatCurrency(months.reduce((s, m) => s + m.fixedCost, 0))}</td>
                <td className="py-2 px-2 text-right text-xs tabular-nums">{formatCurrency(months.reduce((s, m) => s + m.marketingBudget, 0))}</td>
                <td className={`py-2 px-2 text-right text-xs tabular-nums ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.totalProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
