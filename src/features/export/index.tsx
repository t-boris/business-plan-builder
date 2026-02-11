import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function Export() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Export Business Plan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Generate & Export</CardTitle>
          <CardDescription>
            View a polished read-only business plan and export as PDF with
            professional formatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will generate a complete business plan document pulling
            data from all sections and the selected scenario, with PDF export
            capability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
