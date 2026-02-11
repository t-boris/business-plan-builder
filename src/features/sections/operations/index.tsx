import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function Operations() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
      <Card>
        <CardHeader>
          <CardTitle>Crew, Capacity & Logistics</CardTitle>
          <CardDescription>
            Operational planning including crew management, scheduling, travel
            radius, and safety protocols.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will detail crew staffing, capacity constraints,
            weekend slot scheduling, travel radius (15-25 miles), and safety
            protocols for slime/chemical activities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
