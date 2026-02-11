import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function Scenarios() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">What-If Scenarios</h1>
      <Card>
        <CardHeader>
          <CardTitle>Scenario Modeling</CardTitle>
          <CardDescription>
            Interactive what-if engine to model changes in pricing, costs, CAC,
            conversion rates, and capacity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will provide the scenario modeling engine where you can
            adjust any business variable and see how changes propagate through
            the entire business plan in real time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
