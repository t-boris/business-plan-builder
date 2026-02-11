import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function MarketingStrategy() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Marketing Strategy</h1>
      <Card>
        <CardHeader>
          <CardTitle>Channels & Budget Allocation</CardTitle>
          <CardDescription>
            Meta Ads, Google Ads, organic social media, and partnership
            marketing strategies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will cover marketing channels, ad budgets per channel,
            CAC targets, and organic content strategy for TikTok/Instagram.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
