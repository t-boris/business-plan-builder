import { useAtomValue } from 'jotai';
import { businessVariablesAtom } from '@/store/business-atoms.ts';
import { evaluatedValuesAtom } from '@/store/derived-atoms.ts';
import type { VariableUnit } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

function formatValue(value: number, unit: VariableUnit): string {
  if (unit === 'currency') return formatCurrency(value);
  if (unit === 'percent') return formatPercent(value);
  if (unit === 'ratio') return value.toFixed(2);
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

function getSemanticColor(label: string, value: number): string | undefined {
  const lower = label.toLowerCase();
  if (lower.includes('profit')) return getProfitColor(value);
  if (lower.includes('margin')) return getMarginColor(value);
  if (lower.includes('cost') || lower.includes('spend')) return 'text-amber-600';
  if (lower.includes('revenue')) return 'text-green-600';
  return undefined;
}

// --- Main Dynamic Component ---

export function ScenarioDashboard() {
  const definitions = useAtomValue(businessVariablesAtom);
  const evaluated = useAtomValue(evaluatedValuesAtom);

  if (!definitions) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Loading...</p>
      </div>
    );
  }

  // Get all computed variables for KPI cards
  const computedVariables = Object.values(definitions).filter((v) => v.type === 'computed');

  // Find monthly revenue and monthly costs for chart
  const allVariables = Object.values(definitions);
  const revenueVar = allVariables.find(
    (v) => v.id === 'monthly_revenue' || v.label.toLowerCase() === 'monthly revenue'
  );
  const costsVar = allVariables.find(
    (v) => v.id === 'monthly_costs' || v.label.toLowerCase() === 'monthly costs'
  );

  const monthlyRevenue = revenueVar ? (evaluated[revenueVar.id] ?? 0) : null;
  const monthlyCosts = costsVar ? (evaluated[costsVar.id] ?? 0) : null;

  // 12-month flat projection data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const showChart = monthlyRevenue !== null || monthlyCosts !== null;
  const projectionData = showChart
    ? monthNames.map((month) => ({
        month,
        Revenue: monthlyRevenue !== null ? Math.round(monthlyRevenue) : undefined,
        Costs: monthlyCosts !== null ? Math.round(monthlyCosts) : undefined,
      }))
    : [];

  return (
    <div className="space-y-4">
      {/* Stat cards grid */}
      {computedVariables.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {computedVariables.map((variable) => {
            const value = evaluated[variable.id] ?? 0;
            const colorClass = getSemanticColor(variable.label, value);
            return (
              <StatCard
                key={variable.id}
                label={variable.label}
                value={formatValue(value, variable.unit)}
                colorClass={colorClass}
              />
            );
          })}
        </div>
      )}

      {/* 12-month projection chart */}
      {showChart && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">12-Month Revenue Projection</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  {monthlyRevenue !== null && (
                    <Area
                      type="monotone"
                      dataKey="Revenue"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  )}
                  {monthlyCosts !== null && (
                    <Area
                      type="monotone"
                      dataKey="Costs"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
