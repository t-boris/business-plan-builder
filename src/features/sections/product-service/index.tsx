import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function ProductService() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Product & Service</h1>
      <Card>
        <CardHeader>
          <CardTitle>Service Packages</CardTitle>
          <CardDescription>
            Three ocean-themed birthday party packages: Ocean Starter ($800),
            Ocean Explorer ($980), and Ocean VIP ($1,200).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will detail each package, included activities, Jellyfish
            Museum integration, and capacity for 15 participants per event.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
