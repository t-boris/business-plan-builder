import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { sectionDerivedScopeAtom, seasonCoefficientsAtom } from '@/store/business-atoms.ts';
import { scenarioValuesAtom } from '@/store/scenario-atoms.ts';
import { computeScenarioMetrics } from './compute.ts';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// --- Formatting helpers ---

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

// --- Stat Card ---

interface StatCardProps {
  label: string;
  value: string;
  colorClass?: string;
}

function StatCard({ label, value, colorClass = 'text-foreground' }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
}

// --- Semantic color helpers ---

function getMarginColor(margin: number): string {
  if (margin >= 0.2) return 'text-green-600';
  if (margin >= 0.1) return 'text-amber-600';
  return 'text-red-600';
}

function getProfitColor(profit: number): string {
  return profit >= 0 ? 'text-green-600' : 'text-red-600';
}

// --- Main Component ---

export function ScenarioDashboard() {
  const sectionScope = useAtomValue(sectionDerivedScopeAtom);
  const overrides = useAtomValue(scenarioValuesAtom);
  const seasonCoefficients = useAtomValue(seasonCoefficientsAtom);

  const metrics = useMemo(
    () => computeScenarioMetrics(sectionScope, overrides, seasonCoefficients),
    [sectionScope, overrides, seasonCoefficients],
  );

  const hasData = metrics.monthlyRevenue > 0 || metrics.monthlyTotalCosts > 0;

  if (!hasData) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No data yet. Fill in your section data to see scenario metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(metrics.monthlyRevenue)}
          colorClass="text-green-600"
        />
        <StatCard
          label="Monthly Costs"
          value={formatCurrency(metrics.monthlyTotalCosts)}
          colorClass="text-amber-600"
        />
        <StatCard
          label="Monthly Profit"
          value={formatCurrency(metrics.monthlyProfit)}
          colorClass={getProfitColor(metrics.monthlyProfit)}
        />
        <StatCard
          label="Profit Margin"
          value={formatPercent(metrics.profitMargin)}
          colorClass={getMarginColor(metrics.profitMargin)}
        />
      </div>

      {/* Secondary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Gross Margin"
          value={formatPercent(metrics.grossMargin)}
          colorClass={getMarginColor(metrics.grossMargin)}
        />
        <StatCard
          label="Break-even Units"
          value={formatCount(metrics.breakEvenUnits)}
        />
        <StatCard
          label="Annual Revenue"
          value={formatCurrency(metrics.annualRevenue)}
          colorClass="text-green-600"
        />
        <StatCard
          label="Annual Profit"
          value={formatCurrency(metrics.annualProfit)}
          colorClass={getProfitColor(metrics.annualProfit)}
        />
      </div>

      {/* 12-month projection chart */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold">12-Month Projection</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyProjections} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  name="Costs"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
