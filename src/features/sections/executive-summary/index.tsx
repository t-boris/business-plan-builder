import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function ExecutiveSummary() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
      <Card>
        <CardHeader>
          <CardTitle>Business Overview</CardTitle>
          <CardDescription>
            High-level summary of the Fun Box business plan, auto-generated from
            all other sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will provide an auto-generated executive summary pulling
            key data points from every section of your business plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
