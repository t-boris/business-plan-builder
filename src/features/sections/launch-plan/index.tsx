import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function LaunchPlan() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Launch Plan</h1>
      <Card>
        <CardHeader>
          <CardTitle>3-Stage Launch Timeline</CardTitle>
          <CardDescription>
            Preparation, soft launch (March 1-14), and scale phase (March 15+)
            planning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will outline the three launch stages: preparation
            milestones, soft launch activities and success criteria, and the
            scaling plan for full operation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
