import { useAtom } from 'jotai';
import { useCanEdit } from '@/hooks/use-business-role';
import { scenarioNameAtom } from '@/store/scenario-atoms.ts';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { DynamicScenarioControls } from './scenario-controls.tsx';
import { ScenarioDashboard } from './scenario-dashboard.tsx';
import { ScenarioManager } from './scenario-manager.tsx';
import { ScenarioComparison } from './scenario-comparison.tsx';

export function Scenarios() {
  const [scenarioName, setScenarioName] = useAtom(scenarioNameAtom);
  const canEdit = useCanEdit();

  return (
    <div className="page-container">
      <PageHeader
        title="Scenario Modeling"
        description="Adjust variables and see real-time impact on your business metrics"
      >
        <ScenarioManager />
      </PageHeader>

      {/* Tabs: Editor / Compare */}
      <Tabs defaultValue="editor">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-4 px-0 h-auto pb-0">
          <TabsTrigger
            value="editor"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-1 pb-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
          >
            Editor
          </TabsTrigger>
          <TabsTrigger
            value="compare"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-1 pb-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
          >
            Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-6">
          {/* Two-column layout: controls left (40%), dashboard right (60%) */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
            {/* Left panel: Variables */}
            <div className="card-elevated rounded-lg">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Variables</h3>
                </div>
                <div className="mt-3">
                  <label className="text-xs font-medium text-muted-foreground">Scenario Name</label>
                  <Input
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Scenario name"
                    readOnly={!canEdit}
                  />
                </div>
              </div>
              <div className="p-4">
                <DynamicScenarioControls disabled={!canEdit} />
              </div>
            </div>

            {/* Right panel: Live Preview */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-3">Live Preview</p>
              <ScenarioDashboard />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          <ScenarioComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
