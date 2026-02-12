import { Link } from 'react-router';
import { useAtomValue } from 'jotai';
import { scenarioNameAtom } from '@/store/scenario-atoms.ts';
import {
  monthlyBookingsAtom,
  monthlyRevenueAtom,
  monthlyCostsAtom,
  monthlyProfitAtom,
  profitMarginAtom,
  annualRevenueAtom,
  annualProfitAtom,
  totalMonthlyAdSpendAtom,
  cacPerBookingAtom,
} from '@/store/derived-atoms.ts';
import { useSection } from '@/hooks/use-section';
import type { FinancialProjections } from '@/types';

// Flat seasonal coefficients (no seasonal adjustment by default)
const FLAT_SEASON_COEFFICIENTS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

function getMarginColor(margin: number): string {
  if (margin >= 0.2) return 'text-green-600';
  if (margin >= 0.1) return 'text-amber-600';
  return 'text-red-600';
}

function getProfitColor(profit: number): string {
  return profit >= 0 ? 'text-green-600' : 'text-red-600';
}

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

// Minimal default for useSection fallback (only needs seasonCoefficients)
const dashboardFinancialsDefault: FinancialProjections = {
  months: [],
  unitEconomics: { avgCheck: 0, costPerEvent: 0, profitPerEvent: 0, breakEvenEvents: 0 },
  seasonCoefficients: FLAT_SEASON_COEFFICIENTS,
};

export function Dashboard() {
  const scenarioName = useAtomValue(scenarioNameAtom);
  const monthlyBookings = useAtomValue(monthlyBookingsAtom);
  const monthlyRevenue = useAtomValue(monthlyRevenueAtom);
  const monthlyCosts = useAtomValue(monthlyCostsAtom);
  const monthlyProfit = useAtomValue(monthlyProfitAtom);
  const profitMargin = useAtomValue(profitMarginAtom);
  const annualRevenue = useAtomValue(annualRevenueAtom);
  const annualProfit = useAtomValue(annualProfitAtom);
  const totalAdSpend = useAtomValue(totalMonthlyAdSpendAtom);
  const cacPerBooking = useAtomValue(cacPerBookingAtom);

  // Load stored season coefficients from Financial Projections section
  const { data: financials } = useSection<FinancialProjections>('financial-projections', dashboardFinancialsDefault);
  const coefficients = financials.seasonCoefficients?.length === 12
    ? financials.seasonCoefficients
    : FLAT_SEASON_COEFFICIENTS;

  // 12-month projection driven by stored seasonal coefficients
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const projectionData = monthNames.map((month, i) => ({
    month,
    Revenue: Math.round(monthlyRevenue * coefficients[i]),
    Costs: Math.round(monthlyCosts * coefficients[i]),
    Profit: Math.round(monthlyRevenue * coefficients[i]) - Math.round(monthlyCosts * coefficients[i]),
  }));

  return (
    <div className="space-y-6">
      {/* Header with active scenario badge */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Business Planning Dashboard</h1>
        <Link
          to="/scenarios"
          className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 hover:bg-primary/20 transition-colors"
        >
          {scenarioName}
        </Link>
      </div>

      {/* KPI Summary Cards - Primary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          colorClass="text-green-600"
        />
        <KpiCard
          label="Monthly Profit"
          value={formatCurrency(monthlyProfit)}
          colorClass={getProfitColor(monthlyProfit)}
        />
        <KpiCard
          label="Monthly Bookings"
          value={String(monthlyBookings)}
        />
        <KpiCard
          label="Profit Margin"
          value={formatPercent(profitMargin)}
          colorClass={getMarginColor(profitMargin)}
        />
      </div>

      {/* Secondary Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Annual Revenue"
          value={formatCurrency(annualRevenue)}
          colorClass="text-green-600"
          size="sm"
        />
        <KpiCard
          label="Annual Profit"
          value={formatCurrency(annualProfit)}
          colorClass={getProfitColor(annualProfit)}
          size="sm"
        />
        <KpiCard
          label="Total Ad Spend"
          value={formatCurrency(totalAdSpend)}
          colorClass="text-amber-600"
          size="sm"
        />
        <KpiCard
          label="CAC per Booking"
          value={formatCurrency(cacPerBooking)}
          size="sm"
        />
      </div>

      {/* Revenue Projection Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            12-Month Revenue Projection
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
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Costs"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Profit"
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

      {/* Section Links Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Business Plan Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTION_LINKS.map((section) => (
            <Link key={section.url} to={section.url} className="group">
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
    </div>
  );
}
