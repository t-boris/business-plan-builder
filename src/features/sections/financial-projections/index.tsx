import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function FinancialProjections() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Financial Projections</h1>
      <Card>
        <CardHeader>
          <CardTitle>Unit Economics & P&L</CardTitle>
          <CardDescription>
            Revenue projections, cost structure, and profit & loss analysis for
            the Fun Box business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will include unit economics per package, monthly/annual
            revenue projections, cost breakdowns, and full P&L statements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
