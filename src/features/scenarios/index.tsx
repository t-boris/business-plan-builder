import { useAtom } from 'jotai';
import { scenarioNameAtom } from '@/store/scenario-atoms.ts';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScenarioControls } from './scenario-controls.tsx';
import { ScenarioDashboard } from './scenario-dashboard.tsx';
import { ScenarioManager } from './scenario-manager.tsx';
import { ScenarioComparison } from './scenario-comparison.tsx';
import { VariableEditor } from './variable-editor.tsx';

export function Scenarios() {
  const [scenarioName, setScenarioName] = useAtom(scenarioNameAtom);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">What-If Scenarios</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-muted-foreground">Scenario:</span>
          <Input
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="h-8 text-sm w-64"
            placeholder="Scenario name"
          />
        </div>
      </div>

      {/* Scenario Manager: save, load, switch, delete */}
      <ScenarioManager />

      {/* Tabs: Editor / Compare */}
      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          {/* Two-column layout: controls left (40%), dashboard right (60%) */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
            <div>
              <ScenarioControls />
            </div>
            <div>
              <ScenarioDashboard />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="variables">
          <VariableEditor />
        </TabsContent>

        <TabsContent value="compare">
          <ScenarioComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
