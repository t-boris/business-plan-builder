import { useAtomValue } from 'jotai';
import { scenarioNameAtom } from '@/store/scenario-atoms';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { BusinessPlanView } from './business-plan-view';

export function Export() {
  const scenarioName = useAtomValue(scenarioNameAtom);
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Export Business Plan</h1>

      <Tabs defaultValue="business-plan">
        <TabsList>
          <TabsTrigger value="business-plan">
            <FileText className="size-4 mr-1.5" />
            Business Plan
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="size-4 mr-1.5" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-plan">
          <BusinessPlanView />
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Download your business plan as a professionally formatted PDF document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Active Scenario</p>
                  <p className="text-xs text-muted-foreground">
                    Metrics from this scenario will be included in the export.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800">
                  {scenarioName}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Generated on</p>
                  <p className="text-xs text-muted-foreground">{currentDate}</p>
                </div>
              </div>

              <Button disabled className="w-full">
                <Download className="size-4 mr-2" />
                Download PDF — Coming Soon
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                PDF export will be enabled in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
