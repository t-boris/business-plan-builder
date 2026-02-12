import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { scenarioNameAtom } from '@/store/scenario-atoms.ts';
import { evaluatedValuesAtom } from '@/store/derived-atoms.ts';
import { businessVariablesAtom, activeBusinessAtom } from '@/store/business-atoms.ts';
import type { VariableUnit } from '@/types';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  FileText,
  TrendingUp,
  Package,
  Megaphone,
  Settings,
  DollarSign,
  ShieldAlert,
  BarChart3,
  Rocket,
} from 'lucide-react';

// --- Unit priority for smart KPI ordering ---

const unitPriority: Record<VariableUnit, number> = {
  currency: 0,
  percent: 1,
  ratio: 2,
  count: 3,
  months: 4,
  days: 5,
  hours: 6,
};

// --- Semantic chart color palette ---

const CHART_COLORS = {
  revenue: '#22c55e',
  cost: '#f97316',
  profit: '#3b82f6',
  default: '#64748b',
} as const;

function getChartColor(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('revenue') || lower.includes('income') || lower.includes('sales')) {
    return CHART_COLORS.revenue;
  }
  if (lower.includes('cost') || lower.includes('expense') || lower.includes('spend')) {
    return CHART_COLORS.cost;
  }
  if (lower.includes('profit') || lower.includes('net') || lower.includes('margin')) {
    return CHART_COLORS.profit;
  }
  return CHART_COLORS.default;
}

// --- Formatting helpers ---

function formatCurrency(value: number, currencyCode: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatValue(value: number, unit: VariableUnit, currencyCode: string = 'USD'): string {
  if (unit === 'currency') return formatCurrency(value, currencyCode);
  if (unit === 'percent') return formatPercent(value);
  if (unit === 'ratio') return value.toFixed(2);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
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

function getSemanticColor(label: string, value: number): string {
  const lower = label.toLowerCase();
  if (lower.includes('profit')) return getProfitColor(value);
  if (lower.includes('margin')) return getMarginColor(value);
  if (lower.includes('cost') || lower.includes('spend')) return 'text-amber-600';
  if (lower.includes('revenue')) return 'text-green-600';
  return 'text-foreground';
}

// --- KPI Card ---

interface KpiCardProps {
  label: string;
  value: string;
  colorClass?: string;
  size?: 'lg' | 'sm';
}

function KpiCard({ label, value, colorClass = 'text-foreground', size = 'lg' }: KpiCardProps) {
  const textSize = size === 'lg' ? 'text-2xl' : 'text-lg';
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <p className={`${textSize} font-bold ${colorClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

// --- Section Links ---

const SECTION_LINKS = [
  {
    title: 'Executive Summary',
    url: '/executive-summary',
    icon: FileText,
    description: 'Business overview and key highlights',
  },
  {
    title: 'Market Analysis',
    url: '/market-analysis',
    icon: TrendingUp,
    description: 'Target demographics and competition',
  },
  {
    title: 'Product & Service',
    url: '/product-service',
    icon: Package,
    description: 'Products, services, and pricing',
  },
  {
    title: 'Marketing Strategy',
    url: '/marketing-strategy',
    icon: Megaphone,
    description: 'Channels, budgets, and campaigns',
  },
  {
    title: 'Operations',
    url: '/operations',
    icon: Settings,
    description: 'Team, equipment, and workflow',
  },
  {
    title: 'Financial Projections',
    url: '/financial-projections',
    icon: DollarSign,
    description: 'Revenue, costs, and P&L forecast',
  },
  {
    title: 'Risks & Due Diligence',
    url: '/risks-due-diligence',
    icon: ShieldAlert,
    description: 'Risk assessment and compliance',
  },
  {
    title: 'KPIs & Metrics',
    url: '/kpis-metrics',
    icon: BarChart3,
    description: 'Target metrics and benchmarks',
  },
  {
    title: 'Launch Plan',
    url: '/launch-plan',
    icon: Rocket,
    description: 'Pre-launch, launch, and growth stages',
  },
];

// --- Main Dashboard Component ---

export function Dashboard() {
  const { businessId } = useParams<{ businessId: string }>();
  const scenarioName = useAtomValue(scenarioNameAtom);
  const definitions = useAtomValue(businessVariablesAtom);
  const evaluated = useAtomValue(evaluatedValuesAtom);
  const business = useAtomValue(activeBusinessAtom);

  const currencyCode = business?.profile.currency ?? 'USD';

  // Get computed variables for KPI cards, sorted by unit priority
  const sortedComputed = useMemo(() => {
    if (!definitions) return [];
    const computed = Object.values(definitions).filter((v) => v.type === 'computed');
    return [...computed].sort(
      (a, b) => (unitPriority[a.unit] ?? 99) - (unitPriority[b.unit] ?? 99)
    );
  }, [definitions]);

  const primaryKpis = sortedComputed.slice(0, 4);
  const secondaryKpis = sortedComputed.slice(4, 8);

  // Dynamic chart series: find currency-type variables for charting
  const chartSeries = useMemo(() => {
    if (!definitions) return [];
    const allVars = Object.values(definitions);
    const currencyVars = allVars.filter((v) => v.unit === 'currency');
    return currencyVars.slice(0, 3).map((v) => ({
      id: v.id,
      label: v.label,
      color: getChartColor(v.label),
    }));
  }, [definitions]);

  const showChart = chartSeries.length > 0;

  // 12-month flat projection data
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const projectionData = useMemo(() => {
    if (!showChart) return [];
    return monthNames.map((month) => {
      const data: Record<string, unknown> = { month };
      for (const series of chartSeries) {
        data[series.label] = Math.round(evaluated[series.id] ?? 0);
      }
      return data;
    });
  }, [showChart, chartSeries, evaluated]);

  // Filter section links by enabled sections
  const enabledLinks = useMemo(() => {
    if (!business) return SECTION_LINKS;
    return SECTION_LINKS.filter((s) =>
      business.enabledSections.includes(s.url.replace('/', ''))
    );
  }, [business]);

  // Empty state: no computed variables
  const hasNoVariables = !definitions || sortedComputed.length === 0;

  return (
    <div className="space-y-6">
      {/* Header with active scenario badge */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Business Planning Dashboard</h1>
        <Link
          to={`/business/${businessId}/scenarios`}
          className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 hover:bg-primary/20 transition-colors"
        >
          {scenarioName}
        </Link>
      </div>

      {/* Empty state */}
      {hasNoVariables && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No scenario variables configured yet.
            </p>
            <Button variant="link" asChild>
              <Link to={`/business/${businessId}/scenarios`}>
                Configure Scenarios
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Summary Cards - Primary row */}
      {primaryKpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryKpis.map((variable) => {
            const value = evaluated[variable.id] ?? 0;
            return (
              <KpiCard
                key={variable.id}
                label={variable.label}
                value={formatValue(value, variable.unit, currencyCode)}
                colorClass={getSemanticColor(variable.label, value)}
              />
            );
          })}
        </div>
      )}

      {/* Secondary Metrics row */}
      {secondaryKpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryKpis.map((variable) => {
            const value = evaluated[variable.id] ?? 0;
            return (
              <KpiCard
                key={variable.id}
                label={variable.label}
                value={formatValue(value, variable.unit, currencyCode)}
                colorClass={getSemanticColor(variable.label, value)}
                size="sm"
              />
            );
          })}
        </div>
      )}

      {/* 12-Month Financial Projection Chart */}
      {showChart && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              12-Month Financial Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), currencyCode)} />
                  <Legend />
                  {chartSeries.map((series) => (
                    <Area
                      key={series.id}
                      type="monotone"
                      dataKey={series.label}
                      stroke={series.color}
                      fill={series.color}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Links Grid */}
      {enabledLinks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Business Plan Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledLinks.map((section) => (
              <Link key={section.url} to={`/business/${businessId}${section.url}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/30">
                  <CardContent className="pt-4 pb-3 px-4 flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-muted p-2 group-hover:bg-primary/10 transition-colors">
                      <section.icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {section.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {section.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
