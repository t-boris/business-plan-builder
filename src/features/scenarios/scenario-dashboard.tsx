import { useAtomValue } from 'jotai';
import {
  monthlyBookingsAtom,
  avgCheckAtom,
  monthlyRevenueAtom,
  monthlyCostsAtom,
  monthlyProfitAtom,
  profitMarginAtom,
  annualRevenueAtom,
  annualProfitAtom,
  totalMonthlyAdSpendAtom,
  cacPerBookingAtom,
} from '@/store/derived-atoms.ts';
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

function getMarginColor(margin: number): string {
  if (margin >= 0.2) return 'text-green-600';
  if (margin >= 0.1) return 'text-amber-600';
  return 'text-red-600';
}

function getProfitColor(profit: number): string {
  return profit >= 0 ? 'text-green-600' : 'text-red-600';
}

export function ScenarioDashboard() {
  const monthlyBookings = useAtomValue(monthlyBookingsAtom);
  const avgCheck = useAtomValue(avgCheckAtom);
  const monthlyRevenue = useAtomValue(monthlyRevenueAtom);
  const monthlyCosts = useAtomValue(monthlyCostsAtom);
  const monthlyProfit = useAtomValue(monthlyProfitAtom);
  const profitMargin = useAtomValue(profitMarginAtom);
  const annualRevenue = useAtomValue(annualRevenueAtom);
  const annualProfit = useAtomValue(annualProfitAtom);
  const totalAdSpend = useAtomValue(totalMonthlyAdSpendAtom);
  const cacPerBooking = useAtomValue(cacPerBookingAtom);

  // 12-month projection with a ramp pattern
  const monthNames = [
    'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb',
  ];
  // Ramp: start at 40% of current monthly revenue, reach 100% by month 4
  const rampFactors = [0.4, 0.55, 0.75, 0.9, 1.0, 1.0, 1.0, 1.0, 0.9, 1.1, 0.85, 1.0];
  const projectionData = monthNames.map((month, i) => ({
    month,
    Revenue: Math.round(monthlyRevenue * rampFactors[i]),
    Costs: Math.round(monthlyCosts * rampFactors[i]),
  }));

  return (
    <div className="space-y-4">
      {/* Stat cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard label="Monthly Bookings" value={String(monthlyBookings)} />
        <StatCard label="Average Check" value={formatCurrency(avgCheck)} />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          colorClass="text-green-600"
        />
        <StatCard
          label="Monthly Costs"
          value={formatCurrency(monthlyCosts)}
          colorClass="text-amber-600"
        />
        <StatCard
          label="Monthly Profit"
          value={formatCurrency(monthlyProfit)}
          colorClass={getProfitColor(monthlyProfit)}
        />
        <StatCard
          label="Profit Margin"
          value={formatPercent(profitMargin)}
          colorClass={getMarginColor(profitMargin)}
        />
        <StatCard
          label="Annual Revenue"
          value={formatCurrency(annualRevenue)}
          colorClass="text-green-600"
        />
        <StatCard
          label="Annual Profit"
          value={formatCurrency(annualProfit)}
          colorClass={getProfitColor(annualProfit)}
        />
        <StatCard
          label="Total Ad Spend"
          value={formatCurrency(totalAdSpend)}
          colorClass="text-amber-600"
        />
        <StatCard
          label="CAC per Booking"
          value={formatCurrency(cacPerBooking)}
        />
      </div>

      {/* 12-month projection chart */}
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
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
