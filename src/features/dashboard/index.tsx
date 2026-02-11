import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Fun Box Business Plan Overview</CardTitle>
          <CardDescription>
            Welcome to your business planning dashboard. Navigate the sidebar to
            explore and edit each section of your business plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the sidebar to navigate between the 9 business plan sections,
            run what-if scenarios, or export your plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
