import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function KpisMetrics() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">KPIs & Metrics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>
            Leads, conversion rates, customer acquisition cost, and average
            check tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will track KPI targets: 100-150 leads/month, 15-25%
            conversion, $10-30 CAC per lead, $50-120 CAC per booking, and
            average check benchmarks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
