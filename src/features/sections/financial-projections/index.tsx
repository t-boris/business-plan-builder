import { useSection } from '@/hooks/use-section';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { isAiAvailable } from '@/lib/ai/gemini-client';
import { AiActionBar } from '@/components/ai-action-bar';
import { AiSuggestionPreview } from '@/components/ai-suggestion-preview';
import type { FinancialProjections as FinancialProjectionsType, MonthlyProjection, MonthlyCosts } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';

const MONTH_NAMES = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'];
const MONTH_LABELS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];

// Seasonality presets
const SEASON_PRESET_FLAT: number[] = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
const SEASON_PRESET_SUMMER_PEAK: number[] = [0.60, 0.80, 1.00, 1.30, 1.50, 1.50, 1.10, 0.90, 0.70, 0.80, 0.50, 0.60];

function generateMonthsFromCoefficients(
  coefficients: number[],
  avgCheck: number,
  costPerEvent: number,
  monthlyFixed: number,
  monthlyMarketing: number,
  baseBookings: number,
): MonthlyProjection[] {
  return MONTH_NAMES.map((month, i) => {
    const bookings = Math.round(baseBookings * coefficients[i]);
    const revenue = bookings * avgCheck;
    const marketing = monthlyMarketing;
    const variableCost = costPerEvent * bookings;
    const fixed = monthlyFixed;
    const totalCosts = marketing + variableCost + fixed;
    return {
      month,
      revenue,
      costs: { marketing, labor: variableCost, supplies: 0, museum: 0, transport: 0, fixed },
      profit: revenue - totalCosts,
    };
  });
}

const defaultFinancials: FinancialProjectionsType = {
  months: [],
  unitEconomics: {
    avgCheck: 0,
    costPerEvent: 0,
    profitPerEvent: 0,
    breakEvenEvents: 0,
  },
  seasonCoefficients: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

function sumCosts(costs: MonthlyCosts): number {
  return costs.marketing + costs.labor + costs.supplies + costs.museum + costs.transport + (costs.fixed || 0);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4'];

export function FinancialProjections() {
  const { data, updateData, isLoading } = useSection<FinancialProjectionsType>('financial-projections', defaultFinancials);
  const aiSuggestion = useAiSuggestion<string>('financial-projections');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Financial Projections</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  function handleAccept() {
    aiSuggestion.accept();
  }

  // Ensure fixed costs field exists (migration)
  const months = data.months.map((m) => ({
    ...m,
    costs: { ...m.costs, fixed: m.costs.fixed ?? 0 },
  }));

  const chartData = months.map((m) => ({
    month: m.month,
    Revenue: m.revenue,
    'Total Costs': sumCosts(m.costs),
    Profit: m.revenue - sumCosts(m.costs),
  }));

  // Aggregate totals
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalCosts = months.reduce((s, m) => s + sumCosts(m.costs), 0);
  const totalProfit = totalRevenue - totalCosts;
  const avgMonthlyRevenue = months.length > 0 ? totalRevenue / months.length : 0;
  const avgMonthlyProfit = months.length > 0 ? totalProfit / months.length : 0;
  const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

  // Cost breakdown for pie chart (aggregate across all months)
  const aggCosts = months.reduce(
    (acc, m) => ({
      marketing: acc.marketing + m.costs.marketing,
      labor: acc.labor + m.costs.labor,
      supplies: acc.supplies + m.costs.supplies,
      museum: acc.museum + m.costs.museum,
      transport: acc.transport + m.costs.transport,
      fixed: acc.fixed + (m.costs.fixed || 0),
    }),
    { marketing: 0, labor: 0, supplies: 0, museum: 0, transport: 0, fixed: 0 },
  );

  const costPieData = [
    { name: 'Marketing', value: aggCosts.marketing },
    { name: 'Labor', value: aggCosts.labor },
    { name: 'Supplies', value: aggCosts.supplies },
    { name: 'Museum', value: aggCosts.museum },
    { name: 'Transport', value: aggCosts.transport },
    { name: 'Fixed Costs', value: aggCosts.fixed },
  ].filter((d) => d.value > 0);

  // Monthly profit bar data
  const profitBarData = months.map((m) => ({
    month: m.month.split(' ')[0],
    Profit: m.revenue - sumCosts(m.costs),
  }));

  function updateMonth(index: number, field: 'revenue' | keyof MonthlyCosts, value: number) {
    updateData((prev) => {
      const ms = [...prev.months];
      if (field === 'revenue') {
        const totalC = sumCosts({ ...ms[index].costs, fixed: ms[index].costs.fixed ?? 0 });
        ms[index] = { ...ms[index], revenue: value, profit: value - totalC };
      } else {
        const costs = { ...ms[index].costs, fixed: ms[index].costs.fixed ?? 0, [field]: value };
        const totalC = sumCosts(costs);
        ms[index] = { ...ms[index], costs, profit: ms[index].revenue - totalC };
      }
      return { ...prev, months: ms };
    });
  }

  function updateMonthName(index: number, value: string) {
    updateData((prev) => { const ms = [...prev.months]; ms[index] = { ...ms[index], month: value }; return { ...prev, months: ms }; });
  }

  function addMonth() {
    updateData((prev) => ({ ...prev, months: [...prev.months, { month: 'New Month', revenue: 0, costs: { marketing: 0, labor: 0, supplies: 0, museum: 0, transport: 0, fixed: 0 }, profit: 0 }] }));
  }

  function removeMonth(index: number) {
    updateData((prev) => ({ ...prev, months: prev.months.filter((_, i) => i !== index) }));
  }

  function updateUnitEconomics(field: 'avgCheck' | 'costPerEvent', value: number) {
    updateData((prev) => {
      const ue = { ...prev.unitEconomics, [field]: value };
      ue.profitPerEvent = ue.avgCheck - ue.costPerEvent;
      // Use first month's marketing + fixed costs for break-even, or 0 if no months
      const firstMonth = prev.months[0];
      const monthlyOverhead = firstMonth ? (firstMonth.costs.marketing + (firstMonth.costs.fixed ?? 0)) : 0;
      ue.breakEvenEvents = ue.profitPerEvent > 0 ? Math.ceil(monthlyOverhead / ue.profitPerEvent) : 0;
      return { ...prev, unitEconomics: ue };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Financial Projections</h1>
        <AiActionBar
          onGenerate={() => aiSuggestion.generate('generate', data)}
          onImprove={() => aiSuggestion.generate('improve', data)}
          onExpand={() => aiSuggestion.generate('expand', data)}
          isLoading={aiSuggestion.state.status === 'loading'}
          disabled={!isAiAvailable}
        />
      </div>

      {aiSuggestion.state.status === 'error' && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{aiSuggestion.state.error}</span>
          <Button variant="ghost" size="sm" onClick={aiSuggestion.dismiss}>Dismiss</Button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">12-Month Revenue</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">avg {formatCurrency(avgMonthlyRevenue)}/mo</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">12-Month Costs</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalCosts)}</p>
            <p className="text-xs text-muted-foreground mt-1">avg {formatCurrency(totalCosts / Math.max(months.length, 1))}/mo</p>
          </CardContent>
        </Card>
        <Card className={`${totalProfit >= 0 ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30'}`}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs font-medium text-muted-foreground">12-Month Profit</p>
              {totalProfit >= 0 ? <TrendingUp className="size-3 text-emerald-600" /> : <TrendingDown className="size-3 text-red-600" />}
            </div>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(totalProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">avg {formatCurrency(avgMonthlyProfit)}/mo</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Profit Margin</p>
            <p className={`text-2xl font-bold ${profitMargin >= 0.15 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>{(profitMargin * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">break-even: {data.unitEconomics.breakEvenEvents} events/mo</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Costs Chart */}
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Revenue vs Costs vs Profit</h2></CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} labelStyle={{ fontWeight: 600 }} />
                <Legend />
                <Area type="monotone" dataKey="Revenue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Total Costs" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Profit" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Profit Chart */}
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Monthly Profit</h2></CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitBarData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="Profit" radius={[4, 4, 0, 0]}>
                  {profitBarData.map((entry, index) => (
                    <Cell key={index} fill={entry.Profit >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Seasonality Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Seasonality Coefficients</h2>
            <div className="flex gap-2">
              <Button
                variant={JSON.stringify(data.seasonCoefficients) === JSON.stringify(SEASON_PRESET_FLAT) ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateData((prev) => ({ ...prev, seasonCoefficients: SEASON_PRESET_FLAT }))}
              >
                Flat
              </Button>
              <Button
                variant={JSON.stringify(data.seasonCoefficients) === JSON.stringify(SEASON_PRESET_SUMMER_PEAK) ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateData((prev) => ({ ...prev, seasonCoefficients: SEASON_PRESET_SUMMER_PEAK }))}
              >
                Summer Peak
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(data.seasonCoefficients ?? SEASON_PRESET_FLAT).map((coeff, i) => ({
                  month: MONTH_LABELS[i],
                  Coefficient: coeff,
                }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 2]} tickFormatter={(v: number) => v.toFixed(1)} />
                <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '1.0', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
                <Bar dataKey="Coefficient" radius={[4, 4, 0, 0]}>
                  {(data.seasonCoefficients ?? SEASON_PRESET_FLAT).map((coeff, index) => (
                    <Cell key={index} fill={coeff >= 1.0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-12 gap-1">
            {MONTH_LABELS.map((label, i) => (
              <div key={i} className="text-center">
                <label className="text-[10px] font-medium text-muted-foreground block mb-0.5">{label}</label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  value={(data.seasonCoefficients ?? SEASON_PRESET_FLAT)[i]}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(2, Number(e.target.value)));
                    updateData((prev) => {
                      const coeffs = [...(prev.seasonCoefficients ?? SEASON_PRESET_FLAT)];
                      coeffs[i] = val;
                      return { ...prev, seasonCoefficients: coeffs };
                    });
                  }}
                  className="h-7 text-[11px] text-center px-0.5"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                const coeffs = data.seasonCoefficients ?? SEASON_PRESET_FLAT;
                const avgCheck = data.unitEconomics.avgCheck;
                const costPerEvent = data.unitEconomics.costPerEvent;
                // Use first month's fixed + marketing as base, or 0 if no months
                const firstMonth = data.months[0];
                const monthlyFixed = firstMonth ? (firstMonth.costs.fixed ?? 0) : 0;
                const monthlyMarketing = firstMonth ? firstMonth.costs.marketing : 0;
                const baseBookings = data.months.length > 0
                  ? Math.round(data.months.reduce((s, m) => s + (m.revenue > 0 && avgCheck > 0 ? m.revenue / avgCheck : 0), 0) / data.months.length)
                  : 0;
                const newMonths = generateMonthsFromCoefficients(coeffs, avgCheck, costPerEvent, monthlyFixed, monthlyMarketing, baseBookings || 1);
                updateData((prev) => ({ ...prev, months: newMonths }));
              }}
            >
              <RefreshCw className="size-4 mr-1.5" />
              Recalculate Projections
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cost Structure Pie Chart */}
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">12-Month Cost Structure</h2></CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {costPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly P&L Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Monthly P&L</h2>
            <Button variant="outline" size="sm" onClick={addMonth}><Plus className="size-4" />Add Month</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-2 text-left font-medium text-muted-foreground">Month</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Revenue</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Marketing</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Labor</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Supplies</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Museum</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Transport</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Fixed</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Total</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Profit</th>
                  <th className="py-2 pl-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {months.map((m, i) => {
                  const totalC = sumCosts(m.costs);
                  const profit = m.revenue - totalC;
                  return (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-1 pr-2"><Input value={m.month} onChange={(e) => updateMonthName(i, e.target.value)} className="h-8 text-xs w-24" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.revenue} onChange={(e) => updateMonth(i, 'revenue', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.marketing} onChange={(e) => updateMonth(i, 'marketing', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.labor} onChange={(e) => updateMonth(i, 'labor', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.supplies} onChange={(e) => updateMonth(i, 'supplies', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.museum} onChange={(e) => updateMonth(i, 'museum', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.transport} onChange={(e) => updateMonth(i, 'transport', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.fixed ?? 0} onChange={(e) => updateMonth(i, 'fixed', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-2 text-right text-xs font-medium text-muted-foreground">{formatCurrency(totalC)}</td>
                      <td className={`py-1 px-2 text-right text-xs font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</td>
                      <td className="py-1 pl-1"><Button variant="ghost" size="icon-xs" onClick={() => removeMonth(i)}><Trash2 className="size-3" /></Button></td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                {months.length > 0 && (
                  <tr className="border-t-2 font-semibold">
                    <td className="py-2 pr-2 text-xs">TOTAL</td>
                    <td className="py-2 px-2 text-right text-xs text-green-600">{formatCurrency(totalRevenue)}</td>
                    <td className="py-2 px-2 text-right text-xs">{formatCurrency(aggCosts.marketing)}</td>
                    <td className="py-2 px-2 text-right text-xs">{formatCurrency(aggCosts.labor)}</td>
                    <td className="py-2 px-2 text-right text-xs">{formatCurrency(aggCosts.supplies)}</td>
                    <td className="py-2 px-2 text-right text-xs">{formatCurrency(aggCosts.museum)}</td>
                    <td className="py-2 px-2 text-right text-xs">{formatCurrency(aggCosts.transport)}</td>
                    <td className="py-2 px-2 text-right text-xs">{formatCurrency(aggCosts.fixed)}</td>
                    <td className="py-2 px-2 text-right text-xs text-red-600">{formatCurrency(totalCosts)}</td>
                    <td className={`py-2 px-2 text-right text-xs ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Unit Economics Card */}
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Unit Economics (per event)</h2></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Average Check ($)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7" value={data.unitEconomics.avgCheck} onChange={(e) => updateUnitEconomics('avgCheck', Number(e.target.value))} /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cost Per Event ($)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7" value={data.unitEconomics.costPerEvent} onChange={(e) => updateUnitEconomics('costPerEvent', Number(e.target.value))} /></div>
              <p className="text-[10px] text-muted-foreground mt-1">Computed from operations cost breakdown</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Profit Per Event ($)</label>
              <div className={`relative flex h-9 items-center rounded-md px-3 text-sm font-bold ${data.unitEconomics.profitPerEvent >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                {formatCurrency(data.unitEconomics.profitPerEvent)}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Break-Even Events/Mo</label>
              <div className="flex h-9 items-center rounded-md bg-muted px-3 text-sm font-bold">
                {data.unitEconomics.breakEvenEvents}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">To cover monthly fixed + marketing costs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestion */}
      {aiSuggestion.state.status === 'loading' && (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject} isLoading>
          <div />
        </AiSuggestionPreview>
      )}

      {aiSuggestion.state.status === 'preview' && aiSuggestion.state.suggested && (
        <AiSuggestionPreview onAccept={handleAccept} onReject={aiSuggestion.reject}>
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">AI Financial Analysis</h2></CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
                {String(aiSuggestion.state.suggested)}
              </div>
            </CardContent>
          </Card>
        </AiSuggestionPreview>
      )}
    </div>
  );
}
