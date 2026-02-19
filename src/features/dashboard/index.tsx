import { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';
import { scenarioNameAtom } from '@/store/scenario-atoms.ts';
import { evaluatedValuesAtom } from '@/store/derived-atoms.ts';
import { businessVariablesAtom, activeBusinessAtom } from '@/store/business-atoms.ts';
import type { VariableUnit } from '@/types';

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
  GitBranch,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';

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

// --- Y-axis tick formatter (abbreviate large numbers) ---

function formatAxisTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

// --- Semantic color helpers ---

function getMarginColor(margin: number): string {
  if (margin >= 0.2) return 'text-emerald-600 dark:text-emerald-400';
  if (margin >= 0.1) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getProfitColor(profit: number): string {
  return profit >= 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';
}

function getSemanticColor(label: string, value: number): string {
  const lower = label.toLowerCase();
  if (lower.includes('profit')) return getProfitColor(value);
  if (lower.includes('margin')) return getMarginColor(value);
  if (lower.includes('cost') || lower.includes('spend')) return 'text-amber-600 dark:text-amber-400';
  if (lower.includes('revenue') || lower.includes('income') || lower.includes('sales')) return 'text-emerald-600 dark:text-emerald-400';
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
  const valueSize = size === 'lg' ? 'text-2xl' : 'text-lg';
  return (
    <div className="card-elevated rounded-lg p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className={`${valueSize} font-semibold tabular-nums mt-1 ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}

// --- Section Links ---

interface SectionLink {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

const SECTION_LINKS: SectionLink[] = [
  {
    title: 'Executive Summary',
    url: '/executive-summary',
    icon: FileText,
    description: 'Business overview and key highlights',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  {
    title: 'Market Analysis',
    url: '/market-analysis',
    icon: TrendingUp,
    description: 'Target demographics and competition',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  {
    title: 'Product & Service',
    url: '/product-service',
    icon: Package,
    description: 'Products, services, and pricing',
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
  },
  {
    title: 'Marketing Strategy',
    url: '/marketing-strategy',
    icon: Megaphone,
    description: 'Channels, budgets, and campaigns',
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  },
  {
    title: 'Operations',
    url: '/operations',
    icon: Settings,
    description: 'Team, equipment, and workflow',
    color: 'bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400',
  },
  {
    title: 'Financial Projections',
    url: '/financial-projections',
    icon: DollarSign,
    description: 'Revenue, costs, and P&L forecast',
    color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  },
  {
    title: 'Risks & Due Diligence',
    url: '/risks-due-diligence',
    icon: ShieldAlert,
    description: 'Risk assessment and compliance',
    color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  },
  {
    title: 'KPIs & Metrics',
    url: '/kpis-metrics',
    icon: BarChart3,
    description: 'Target metrics and benchmarks',
    color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
  },
  {
    title: 'Launch Plan',
    url: '/launch-plan',
    icon: Rocket,
    description: 'Pre-launch, launch, and growth stages',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
];

// --- Custom Tooltip ---

function CustomTooltip({
  active,
  payload,
  label,
  currencyCode,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currencyCode: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-medium text-slate-900">
            {formatCurrency(entry.value, currencyCode)}
          </span>
        </div>
      ))}
    </div>
  );
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// --- Main Dashboard Component ---

export function Dashboard() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const scenarioName = useAtomValue(scenarioNameAtom);
  const definitions = useAtomValue(businessVariablesAtom);
  const evaluated = useAtomValue(evaluatedValuesAtom);
  const business = useAtomValue(activeBusinessAtom);

  const currencyCode = business?.profile.currency ?? 'USD';
  const businessName = business?.profile.name ?? 'Dashboard';

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
  const projectionData = useMemo(() => {
    if (!showChart) return [];
    return MONTH_NAMES.map((month) => {
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
    <div className="page-container">
      {/* Header with active scenario badge */}
      <PageHeader
        title={businessName}
        description="Overview of key metrics and projections"
      >
        <Link
          to={`/business/${businessId}/scenarios`}
          className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full hover:bg-primary/15 transition-colors"
        >
          {scenarioName}
        </Link>
      </PageHeader>

      {/* Empty state */}
      {hasNoVariables && (
        <EmptyState
          icon={GitBranch}
          title="No scenario variables configured"
          description="Set up variables and scenarios to see key metrics and financial projections."
          action={{
            label: 'Configure Scenarios',
            onClick: () => navigate(`/business/${businessId}/scenarios`),
          }}
        />
      )}

      {/* KPI Summary Cards - Primary row */}
      {primaryKpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
        <div className="card-elevated rounded-lg">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium">12-Month Financial Projection</h3>
            <span className="text-xs text-muted-foreground">{scenarioName}</span>
          </div>
          <div className="px-4 pb-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatAxisTick}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    content={<CustomTooltip currencyCode={currencyCode} />}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  />
                  {chartSeries.map((series) => (
                    <Area
                      key={series.id}
                      type="monotone"
                      dataKey={series.label}
                      stroke={series.color}
                      fill={series.color}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Section Links Grid */}
      {enabledLinks.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Business Plan Sections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enabledLinks.map((section) => (
              <Link
                key={section.url}
                to={`/business/${businessId}${section.url}`}
                className="group"
              >
                <div className="card-elevated rounded-lg p-4 flex items-start gap-3 h-full group-hover:border-primary/30">
                  <div className={`flex items-center justify-center size-8 rounded-full shrink-0 ${section.color}`}>
                    <section.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {section.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
