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
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function generateDefaultMonths(): MonthlyProjection[] {
  const monthNames = ['Mar 2026','Apr 2026','May 2026','Jun 2026','Jul 2026','Aug 2026','Sep 2026','Oct 2026','Nov 2026','Dec 2026','Jan 2027','Feb 2027'];
  const bookingsPerMonth = [10, 12, 18, 22, 25, 25, 25, 25, 22, 28, 20, 25];
  const avgCheck = 993;
  return monthNames.map((month, i) => {
    const bookings = bookingsPerMonth[i];
    const revenue = bookings * avgCheck;
    const marketing = 2200;
    const labor = 3 * 20 * 4 * bookings;
    const supplies = 50 * bookings;
    const museum = 200 * bookings;
    const transport = 150 * bookings;
    const totalCosts = marketing + labor + supplies + museum + transport;
    return { month, revenue, costs: { marketing, labor, supplies, museum, transport }, profit: revenue - totalCosts };
  });
}

const defaultFinancials: FinancialProjectionsType = {
  months: generateDefaultMonths(),
  unitEconomics: { avgCheck: 993, costPerEvent: 450, profitPerEvent: 543, breakEvenEvents: 5 },
};

function sumCosts(costs: MonthlyCosts): number {
  return costs.marketing + costs.labor + costs.supplies + costs.museum + costs.transport;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function FinancialProjections() {
  const { data, updateData, isLoading } = useSection<FinancialProjectionsType>('financial-projections', defaultFinancials);
  // Financial projections uses free-text AI (no schema) -- AI generates narrative, not numbers
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
    // For financial projections, AI only generates narrative text - not replacing data
    aiSuggestion.accept();
  }

  const chartData = data.months.map((m) => ({ month: m.month, Revenue: m.revenue, 'Total Costs': sumCosts(m.costs) }));

  function updateMonth(index: number, field: 'revenue' | keyof MonthlyCosts, value: number) {
    updateData((prev) => {
      const months = [...prev.months];
      if (field === 'revenue') {
        const totalCosts = sumCosts(months[index].costs);
        months[index] = { ...months[index], revenue: value, profit: value - totalCosts };
      } else {
        const costs = { ...months[index].costs, [field]: value };
        const totalCosts = sumCosts(costs);
        months[index] = { ...months[index], costs, profit: months[index].revenue - totalCosts };
      }
      return { ...prev, months };
    });
  }

  function updateMonthName(index: number, value: string) {
    updateData((prev) => { const months = [...prev.months]; months[index] = { ...months[index], month: value }; return { ...prev, months }; });
  }

  function addMonth() {
    updateData((prev) => ({ ...prev, months: [...prev.months, { month: 'New Month', revenue: 0, costs: { marketing: 2200, labor: 0, supplies: 0, museum: 0, transport: 0 }, profit: -2200 }] }));
  }

  function removeMonth(index: number) {
    updateData((prev) => ({ ...prev, months: prev.months.filter((_, i) => i !== index) }));
  }

  function updateUnitEconomics(field: 'avgCheck' | 'costPerEvent', value: number) {
    updateData((prev) => {
      const ue = { ...prev.unitEconomics, [field]: value };
      ue.profitPerEvent = ue.avgCheck - ue.costPerEvent;
      ue.breakEvenEvents = ue.profitPerEvent > 0 ? Math.ceil(2200 / ue.profitPerEvent) : 0;
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

      {/* Revenue vs Costs Chart */}
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Revenue vs Costs</h2></CardHeader>
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
              </AreaChart>
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
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Total Costs</th>
                  <th className="py-2 px-2 text-right font-medium text-muted-foreground">Profit</th>
                  <th className="py-2 pl-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {data.months.map((m, i) => {
                  const totalCosts = sumCosts(m.costs);
                  const profit = m.revenue - totalCosts;
                  return (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-1 pr-2"><Input value={m.month} onChange={(e) => updateMonthName(i, e.target.value)} className="h-8 text-xs w-24" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.revenue} onChange={(e) => updateMonth(i, 'revenue', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.marketing} onChange={(e) => updateMonth(i, 'marketing', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.labor} onChange={(e) => updateMonth(i, 'labor', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.supplies} onChange={(e) => updateMonth(i, 'supplies', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.museum} onChange={(e) => updateMonth(i, 'museum', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-1"><Input type="number" value={m.costs.transport} onChange={(e) => updateMonth(i, 'transport', Number(e.target.value))} className="h-8 text-xs text-right w-20" /></td>
                      <td className="py-1 px-2 text-right text-xs font-medium text-muted-foreground">{formatCurrency(totalCosts)}</td>
                      <td className={`py-1 px-2 text-right text-xs font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</td>
                      <td className="py-1 pl-1"><Button variant="ghost" size="icon-xs" onClick={() => removeMonth(i)}><Trash2 className="size-3" /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Unit Economics Card */}
      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Unit Economics</h2></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Average Check ($)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7" value={data.unitEconomics.avgCheck} onChange={(e) => updateUnitEconomics('avgCheck', Number(e.target.value))} /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cost Per Event ($)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7" value={data.unitEconomics.costPerEvent} onChange={(e) => updateUnitEconomics('costPerEvent', Number(e.target.value))} /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Profit Per Event ($)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span><Input type="number" className="pl-7 bg-muted" value={data.unitEconomics.profitPerEvent} readOnly /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Break-Even Events</label>
              <Input type="number" className="bg-muted" value={data.unitEconomics.breakEvenEvents} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestion - shows as narrative card below the financial data */}
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
