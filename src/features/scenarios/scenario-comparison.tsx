import { useState, useEffect, useMemo } from 'react';
import { computeDerivedMetrics, type ComputedMetrics } from '@/store/derived-atoms.ts';
import { listScenarios } from '@/lib/firestore.ts';
import type { Scenario, ScenarioVariables } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const PLAN_ID = 'default';

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

// Variable display config for the inputs table
const VARIABLE_ROWS: {
  key: keyof ScenarioVariables;
  label: string;
  format: (v: number) => string;
  lowerIsBetter?: boolean;
}[] = [
  { key: 'priceStarter', label: 'Starter Price', format: formatCurrency },
  { key: 'priceExplorer', label: 'Explorer Price', format: formatCurrency },
  { key: 'priceVIP', label: 'VIP Price', format: formatCurrency },
  { key: 'monthlyLeads', label: 'Monthly Leads', format: (v) => String(v) },
  { key: 'conversionRate', label: 'Conversion Rate', format: formatPercent },
  { key: 'cacPerLead', label: 'CAC per Lead', format: formatCurrency, lowerIsBetter: true },
  { key: 'monthlyAdBudgetMeta', label: 'Meta Ads Budget', format: formatCurrency },
  { key: 'monthlyAdBudgetGoogle', label: 'Google Ads Budget', format: formatCurrency },
  { key: 'crewCount', label: 'Crew Count', format: (v) => String(v) },
  { key: 'costPerEvent', label: 'Cost per Event', format: formatCurrency, lowerIsBetter: true },
];

// Metric display config for the derived metrics table
const METRIC_ROWS: {
  key: keyof ComputedMetrics;
  label: string;
  format: (v: number) => string;
  lowerIsBetter?: boolean;
}[] = [
  { key: 'monthlyBookings', label: 'Monthly Bookings', format: (v) => String(v) },
  { key: 'avgCheck', label: 'Avg Check', format: formatCurrency },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', format: formatCurrency },
  { key: 'monthlyCosts', label: 'Monthly Costs', format: formatCurrency, lowerIsBetter: true },
  { key: 'monthlyProfit', label: 'Monthly Profit', format: formatCurrency },
  { key: 'profitMargin', label: 'Profit Margin', format: formatPercent },
  { key: 'totalMonthlyAdSpend', label: 'Total Ad Spend', format: formatCurrency, lowerIsBetter: true },
  { key: 'cacPerBooking', label: 'CAC per Booking', format: formatCurrency, lowerIsBetter: true },
  { key: 'annualRevenue', label: 'Annual Revenue', format: formatCurrency },
  { key: 'annualProfit', label: 'Annual Profit', format: formatCurrency },
];

function DiffCell({ diff, formatted, lowerIsBetter }: { diff: number; formatted: string; lowerIsBetter?: boolean }) {
  if (diff === 0) return <span className="text-muted-foreground">--</span>;
  // For "lower is better" metrics, a positive diff is bad (costs went up)
  const isImprovement = lowerIsBetter ? diff < 0 : diff > 0;
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={isImprovement ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
      {sign}{formatted}
    </span>
  );
}

function WinnerBadge({ a, b, lowerIsBetter }: { a: number; b: number; lowerIsBetter?: boolean }) {
  if (a === b) return <span className="text-muted-foreground text-xs">Tie</span>;
  const aWins = lowerIsBetter ? a < b : a > b;
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        aWins
          ? 'bg-blue-50 text-blue-700 ring-blue-700/10'
          : 'bg-emerald-50 text-emerald-700 ring-emerald-700/10'
      }`}
    >
      {aWins ? 'A' : 'B'}
    </span>
  );
}

function isSignificantDiff(a: number, b: number): boolean {
  if (a === 0 && b === 0) return false;
  const avg = (Math.abs(a) + Math.abs(b)) / 2;
  if (avg === 0) return false;
  return Math.abs(a - b) / avg > 0.1;
}

export function ScenarioComparison() {
  const [scenarioAId, setScenarioAId] = useState<string>('');
  const [scenarioBId, setScenarioBId] = useState<string>('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Load all scenarios from Firestore for comparison
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    listScenarios(PLAN_ID)
      .then((list) => {
        if (!mounted) return;
        setScenarios(list);
        // Auto-select first two if available
        if (list.length >= 2) {
          setScenarioAId(list[0].metadata.id);
          setScenarioBId(list[1].metadata.id);
        } else if (list.length === 1) {
          setScenarioAId(list[0].metadata.id);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsOffline(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const scenarioA = scenarios.find((s) => s.metadata.id === scenarioAId);
  const scenarioB = scenarios.find((s) => s.metadata.id === scenarioBId);

  const metricsA = useMemo(
    () => (scenarioA ? computeDerivedMetrics(scenarioA.variables) : null),
    [scenarioA]
  );
  const metricsB = useMemo(
    () => (scenarioB ? computeDerivedMetrics(scenarioB.variables) : null),
    [scenarioB]
  );

  // Bar chart data
  const chartData = useMemo(() => {
    if (!metricsA || !metricsB) return [];
    return [
      { category: 'Revenue', A: metricsA.monthlyRevenue, B: metricsB.monthlyRevenue },
      { category: 'Costs', A: metricsA.monthlyCosts, B: metricsB.monthlyCosts },
      { category: 'Profit', A: metricsA.monthlyProfit, B: metricsB.monthlyProfit },
      { category: 'Ad Spend', A: metricsA.totalMonthlyAdSpend, B: metricsB.totalMonthlyAdSpend },
    ];
  }, [metricsA, metricsB]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Loading scenarios...
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="text-amber-600 bg-amber-50 px-3 py-2 rounded text-sm">
          Offline mode - comparison requires saved scenarios in Firestore
        </span>
      </div>
    );
  }

  if (scenarios.length < 2) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Save at least 2 scenarios to compare them side by side.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scenario Selectors */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Scenario A</label>
          <Select value={scenarioAId} onValueChange={setScenarioAId}>
            <SelectTrigger className="w-[220px] h-8 text-sm">
              <SelectValue placeholder="Select scenario A" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((s) => (
                <SelectItem key={s.metadata.id} value={s.metadata.id}>
                  {s.metadata.name}
                  {s.metadata.isBaseline && ' (Baseline)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-muted-foreground font-medium mt-5">vs</span>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Scenario B</label>
          <Select value={scenarioBId} onValueChange={setScenarioBId}>
            <SelectTrigger className="w-[220px] h-8 text-sm">
              <SelectValue placeholder="Select scenario B" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((s) => (
                <SelectItem key={s.metadata.id} value={s.metadata.id}>
                  {s.metadata.name}
                  {s.metadata.isBaseline && ' (Baseline)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {scenarioA && scenarioB && metricsA && metricsB && (
        <>
          {/* Input Variables Comparison Table */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-sm font-semibold">Input Variables Comparison</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Variable</th>
                      <th className="text-right py-2 px-4 font-medium text-blue-700">
                        {scenarioA.metadata.name}
                      </th>
                      <th className="text-right py-2 px-4 font-medium text-emerald-700">
                        {scenarioB.metadata.name}
                      </th>
                      <th className="text-right py-2 pl-4 font-medium text-muted-foreground">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VARIABLE_ROWS.map((row) => {
                      const valA = scenarioA.variables[row.key];
                      const valB = scenarioB.variables[row.key];
                      const diff = valB - valA;
                      return (
                        <tr key={row.key} className="border-b last:border-0">
                          <td className="py-2 pr-4">{row.label}</td>
                          <td className="text-right py-2 px-4">{row.format(valA)}</td>
                          <td className="text-right py-2 px-4">{row.format(valB)}</td>
                          <td className="text-right py-2 pl-4">
                            <DiffCell
                              diff={diff}
                              formatted={row.format(Math.abs(diff))}
                              lowerIsBetter={row.lowerIsBetter}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Derived Metrics Comparison Table */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-sm font-semibold">Derived Metrics Comparison</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Metric</th>
                      <th className="text-right py-2 px-4 font-medium text-blue-700">
                        {scenarioA.metadata.name}
                      </th>
                      <th className="text-right py-2 px-4 font-medium text-emerald-700">
                        {scenarioB.metadata.name}
                      </th>
                      <th className="text-right py-2 px-4 font-medium text-muted-foreground">Diff</th>
                      <th className="text-center py-2 pl-4 font-medium text-muted-foreground">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {METRIC_ROWS.map((row) => {
                      const valA = metricsA[row.key];
                      const valB = metricsB[row.key];
                      const diff = valB - valA;
                      const significant = isSignificantDiff(valA, valB);
                      const aWins = row.lowerIsBetter ? valA < valB : valA > valB;
                      const rowBg = significant
                        ? aWins
                          ? 'bg-blue-50/50'
                          : 'bg-emerald-50/50'
                        : '';
                      return (
                        <tr key={row.key} className={`border-b last:border-0 ${rowBg}`}>
                          <td className="py-2 pr-4 font-medium">{row.label}</td>
                          <td className="text-right py-2 px-4">{row.format(valA)}</td>
                          <td className="text-right py-2 px-4">{row.format(valB)}</td>
                          <td className="text-right py-2 px-4">
                            <DiffCell
                              diff={diff}
                              formatted={row.format(Math.abs(diff))}
                              lowerIsBetter={row.lowerIsBetter}
                            />
                          </td>
                          <td className="text-center py-2 pl-4">
                            <WinnerBadge a={valA} b={valB} lowerIsBetter={row.lowerIsBetter} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Bar Chart */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-sm font-semibold">Visual Comparison</h3>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar
                      dataKey="A"
                      name={scenarioA.metadata.name}
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="B"
                      name={scenarioB.metadata.name}
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
