import { useState, useEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { listScenarioData } from '@/lib/business-firestore.ts';
import { activeBusinessIdAtom, sectionDerivedScopeAtom, seasonCoefficientsAtom } from '@/store/business-atoms.ts';
import { evaluateScenarioFromFirestore, type ScenarioMetrics } from './compute.ts';
import { LEVER_MAP } from './lever-definitions.ts';
import type { DynamicScenario } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
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
import { ChevronDown } from 'lucide-react';

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

// --- Financial metric row definitions ---

interface MetricRow {
  key: keyof ScenarioMetrics;
  label: string;
  format: (v: number) => string;
  lowerIsBetter?: boolean;
}

const FINANCIAL_METRIC_ROWS: MetricRow[] = [
  { key: 'monthlyRevenue', label: 'Monthly Revenue', format: formatCurrency },
  { key: 'monthlyTotalCosts', label: 'Monthly Costs', format: formatCurrency, lowerIsBetter: true },
  { key: 'monthlyProfit', label: 'Monthly Profit', format: formatCurrency },
  { key: 'profitMargin', label: 'Profit Margin', format: formatPercent },
  { key: 'grossMargin', label: 'Gross Margin', format: formatPercent },
  { key: 'breakEvenUnits', label: 'Break-even Units', format: formatCount, lowerIsBetter: true },
  { key: 'annualRevenue', label: 'Annual Revenue', format: formatCurrency },
  { key: 'annualProfit', label: 'Annual Profit', format: formatCurrency },
];

// --- Reusable comparison UI helpers ---

function DiffCell({ diff, formatted, lowerIsBetter }: { diff: number; formatted: string; lowerIsBetter?: boolean }) {
  if (diff === 0) return <span className="text-muted-foreground">--</span>;
  const isImprovement = lowerIsBetter ? diff < 0 : diff > 0;
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={`tabular-nums font-medium ${isImprovement ? 'text-emerald-600' : 'text-red-600'}`}>
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

// --- Collapsible section wrapper ---

function ComparisonSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className="card-elevated rounded-lg overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 border-b hover:bg-muted/30 transition-colors cursor-pointer">
          <h3 className="text-sm font-semibold">{title}</h3>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// --- Input variable row builder ---

function getInputRows(scenarioA: DynamicScenario, scenarioB: DynamicScenario): { id: string; label: string }[] {
  const allKeys = new Set([...Object.keys(scenarioA.values), ...Object.keys(scenarioB.values)]);
  return Array.from(allKeys).map((id) => ({
    id,
    label: LEVER_MAP.get(id)?.label ?? id,
  }));
}

// --- Status helpers ---

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 ring-gray-300' },
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 ring-emerald-300' },
  archived: { label: 'Archived', className: 'bg-amber-50 text-amber-700 ring-amber-300' },
};

export function ScenarioComparison() {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const sectionScope = useAtomValue(sectionDerivedScopeAtom);
  const seasonCoefficients = useAtomValue(seasonCoefficientsAtom);
  const [scenarioAId, setScenarioAId] = useState<string>('');
  const [scenarioBId, setScenarioBId] = useState<string>('');
  const [scenarios, setScenarios] = useState<DynamicScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Load all scenarios from Firestore for comparison
  useEffect(() => {
    if (!businessId) return;
    let mounted = true;
    setLoading(true);

    listScenarioData(businessId)
      .then((list) => {
        if (!mounted) return;
        setScenarios(list);
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
  }, [businessId]);

  const scenarioA = scenarios.find((s) => s.metadata.id === scenarioAId);
  const scenarioB = scenarios.find((s) => s.metadata.id === scenarioBId);

  // Evaluate each scenario using compute.ts
  const metricsA = useMemo(
    () => (scenarioA ? evaluateScenarioFromFirestore(scenarioA, sectionScope, seasonCoefficients) : null),
    [scenarioA, sectionScope, seasonCoefficients]
  );
  const metricsB = useMemo(
    () => (scenarioB ? evaluateScenarioFromFirestore(scenarioB, sectionScope, seasonCoefficients) : null),
    [scenarioB, sectionScope, seasonCoefficients]
  );

  // Input variable rows
  const inputRows = useMemo(() => {
    if (!scenarioA || !scenarioB) return [];
    return getInputRows(scenarioA, scenarioB);
  }, [scenarioA, scenarioB]);

  // Bar chart data from fixed metric keys
  const chartData = useMemo(() => {
    if (!metricsA || !metricsB) return [];
    return [
      { category: 'Revenue', A: metricsA.monthlyRevenue, B: metricsB.monthlyRevenue },
      { category: 'Costs', A: metricsA.monthlyTotalCosts, B: metricsB.monthlyTotalCosts },
      { category: 'Profit', A: metricsA.monthlyProfit, B: metricsB.monthlyProfit },
    ];
  }, [metricsA, metricsB]);

  // Build assumptions comparison data
  const assumptionsComparison = useMemo(() => {
    if (!scenarioA || !scenarioB) return null;
    const aAssumptions = scenarioA.assumptions ?? [];
    const bAssumptions = scenarioB.assumptions ?? [];

    const aLabelSet = new Set(aAssumptions.map((a) => a.label.toLowerCase()));

    type AssumptionRow = {
      label: string;
      aValue: string | null;
      bValue: string | null;
      uniqueTo: 'A' | 'B' | null;
      category: string;
    };

    const rows: AssumptionRow[] = [];

    for (const a of aAssumptions) {
      const matching = bAssumptions.find((b) => b.label.toLowerCase() === a.label.toLowerCase());
      rows.push({
        label: a.label,
        aValue: a.value,
        bValue: matching?.value ?? null,
        uniqueTo: matching ? null : 'A',
        category: a.category ?? 'General',
      });
    }

    for (const b of bAssumptions) {
      if (!aLabelSet.has(b.label.toLowerCase())) {
        rows.push({
          label: b.label,
          aValue: null,
          bValue: b.value,
          uniqueTo: 'B',
          category: b.category ?? 'General',
        });
      }
    }

    return { rows };
  }, [scenarioA, scenarioB]);

  if (!businessId) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
        Select a business to compare scenarios.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
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
      <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
        Save at least 2 scenarios to compare them side by side.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          {/* Financial Metrics - expanded by default */}
          <ComparisonSection title="Financial Metrics" defaultOpen>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Metric</th>
                    <th className="text-right py-2.5 px-4 font-medium text-blue-700">
                      {scenarioA.metadata.name}
                    </th>
                    <th className="text-right py-2.5 px-4 font-medium text-emerald-700">
                      {scenarioB.metadata.name}
                    </th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Diff</th>
                    <th className="text-center py-2.5 px-4 font-medium text-muted-foreground">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {FINANCIAL_METRIC_ROWS.map((row, i) => {
                    const valA = metricsA[row.key] as number;
                    const valB = metricsB[row.key] as number;
                    const diff = valB - valA;
                    const significant = isSignificantDiff(valA, valB);
                    const aWins = row.lowerIsBetter ? valA < valB : valA > valB;
                    const rowBg = significant
                      ? aWins
                        ? 'bg-blue-50/50'
                        : 'bg-emerald-50/50'
                      : i % 2 === 1
                        ? 'bg-muted/20'
                        : '';
                    return (
                      <tr key={row.key} className={`border-b last:border-0 ${rowBg}`}>
                        <td className="py-2 px-4 font-medium">{row.label}</td>
                        <td className="text-right py-2 px-4 tabular-nums">{row.format(valA)}</td>
                        <td className="text-right py-2 px-4 tabular-nums">{row.format(valB)}</td>
                        <td className="text-right py-2 px-4">
                          <DiffCell
                            diff={diff}
                            formatted={row.format(Math.abs(diff))}
                            lowerIsBetter={row.lowerIsBetter}
                          />
                        </td>
                        <td className="text-center py-2 px-4">
                          <WinnerBadge a={valA} b={valB} lowerIsBetter={row.lowerIsBetter} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visual comparison chart */}
            <div className="p-4 border-t">
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
            </div>
          </ComparisonSection>

          {/* Input Variables - collapsed by default */}
          {inputRows.length > 0 && (
            <ComparisonSection title="Input Variables">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Variable</th>
                      <th className="text-right py-2.5 px-4 font-medium text-blue-700">
                        {scenarioA.metadata.name}
                      </th>
                      <th className="text-right py-2.5 px-4 font-medium text-emerald-700">
                        {scenarioB.metadata.name}
                      </th>
                      <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inputRows.map((row, i) => {
                      const valA = scenarioA.values[row.id] ?? sectionScope[row.id] ?? 0;
                      const valB = scenarioB.values[row.id] ?? sectionScope[row.id] ?? 0;
                      const diff = valB - valA;
                      const lever = LEVER_MAP.get(row.id);
                      const fmt = lever?.unit === 'currency' ? formatCurrency
                        : lever?.unit === 'percent' ? formatPercent
                        : formatCount;
                      return (
                        <tr key={row.id} className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                          <td className="py-2 px-4">{row.label}</td>
                          <td className="text-right py-2 px-4 tabular-nums">{fmt(valA)}</td>
                          <td className="text-right py-2 px-4 tabular-nums">{fmt(valB)}</td>
                          <td className="text-right py-2 px-4">
                            <DiffCell diff={diff} formatted={fmt(Math.abs(diff))} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ComparisonSection>
          )}

          {/* Assumptions - collapsed by default */}
          <ComparisonSection title="Assumptions">
            {assumptionsComparison && assumptionsComparison.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Assumption</th>
                      <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-2.5 px-4 font-medium text-blue-700">
                        {scenarioA.metadata.name}
                      </th>
                      <th className="text-left py-2.5 px-4 font-medium text-emerald-700">
                        {scenarioB.metadata.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assumptionsComparison.rows.map((row, i) => (
                      <tr
                        key={`${row.label}-${i}`}
                        className={`border-b last:border-0 ${
                          row.uniqueTo
                            ? row.uniqueTo === 'A'
                              ? 'bg-blue-50/40'
                              : 'bg-emerald-50/40'
                            : i % 2 === 1
                              ? 'bg-muted/20'
                              : ''
                        }`}
                      >
                        <td className="py-2 px-4 font-medium">
                          {row.label}
                          {row.uniqueTo && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ring-1 ring-inset ${
                              row.uniqueTo === 'A'
                                ? 'bg-blue-50 text-blue-700 ring-blue-700/10'
                                : 'bg-emerald-50 text-emerald-700 ring-emerald-700/10'
                            }`}>
                              Only in {row.uniqueTo}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-muted-foreground text-xs">{row.category}</td>
                        <td className="py-2 px-4">{row.aValue ?? <span className="text-muted-foreground">--</span>}</td>
                        <td className="py-2 px-4">{row.bValue ?? <span className="text-muted-foreground">--</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No assumptions defined for the selected scenarios.
              </div>
            )}
          </ComparisonSection>

          {/* Scenario Info - collapsed by default */}
          <ComparisonSection title="Scenario Info">
            <div className="p-4 space-y-3">
              {/* Horizon comparison */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-24">Horizon</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-700 font-medium">
                    {scenarioA.metadata.name}: {scenarioA.horizonMonths ?? 12} months
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-emerald-700 font-medium">
                    {scenarioB.metadata.name}: {scenarioB.horizonMonths ?? 12} months
                  </span>
                  {(scenarioA.horizonMonths ?? 12) !== (scenarioB.horizonMonths ?? 12) && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/10">
                      Different
                    </span>
                  )}
                </div>
              </div>

              {/* Status comparison */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-24">Status</span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const statusA = scenarioA.status ?? 'draft';
                    const statusB = scenarioB.status ?? 'draft';
                    const cfgA = STATUS_LABELS[statusA] ?? STATUS_LABELS.draft;
                    const cfgB = STATUS_LABELS[statusB] ?? STATUS_LABELS.draft;
                    return (
                      <>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfgA.className}`}>
                          {scenarioA.metadata.name}: {cfgA.label}
                        </span>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfgB.className}`}>
                          {scenarioB.metadata.name}: {cfgB.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Creation date comparison */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-24">Created</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-700">
                    {scenarioA.metadata.name}: {new Date(scenarioA.metadata.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-emerald-700">
                    {scenarioB.metadata.name}: {new Date(scenarioB.metadata.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </ComparisonSection>
        </>
      )}
    </div>
  );
}
