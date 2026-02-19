import { useAtom } from 'jotai';
import { useCanEdit } from '@/hooks/use-business-role';
import {
  scenarioNameAtom,
  scenarioStatusAtom,
  scenarioHorizonAtom,
} from '@/store/scenario-atoms.ts';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import { DynamicScenarioControls } from './scenario-controls.tsx';
import { ScenarioDashboard } from './scenario-dashboard.tsx';
import { ScenarioManager } from './scenario-manager.tsx';
import { ScenarioComparison } from './scenario-comparison.tsx';
import { AssumptionsEditor } from './assumptions-editor.tsx';
import { SectionVariants } from './section-variants.tsx';
import type { ScenarioStatus } from '@/types/scenario';

// --- Status badge config ---

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 ring-gray-300',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
  },
  archived: {
    label: 'Archived',
    className: 'bg-amber-50 text-amber-700 ring-amber-300',
  },
};

const STATUS_CYCLE: ScenarioStatus[] = ['draft', 'active', 'archived'];

const HORIZON_OPTIONS = [6, 12, 18, 24, 36];

// --- Tab trigger style (shared) ---

const TAB_TRIGGER_CLASS =
  'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-1 pb-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground';

export function Scenarios() {
  const [scenarioName, setScenarioName] = useAtom(scenarioNameAtom);
  const [status, setStatus] = useAtom(scenarioStatusAtom);
  const [horizon, setHorizon] = useAtom(scenarioHorizonAtom);
  const canEdit = useCanEdit();

  const handleStatusCycle = () => {
    if (!canEdit) return;
    const currentIndex = STATUS_CYCLE.indexOf(status);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    setStatus(STATUS_CYCLE[nextIndex]);
  };

  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="page-container">
      <PageHeader
        title="Scenario Modeling"
        description="Adjust variables and see real-time impact on your business metrics"
      >
        <div className="flex flex-wrap items-center gap-2">
          <ScenarioManager />

          {/* Status badge */}
          <button
            type="button"
            onClick={handleStatusCycle}
            disabled={!canEdit}
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${statusCfg.className} ${canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          >
            {statusCfg.label}
          </button>

          {/* Horizon selector */}
          <Select
            value={String(horizon)}
            onValueChange={(v) => setHorizon(Number(v))}
            disabled={!canEdit}
          >
            <SelectTrigger className="w-[110px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HORIZON_OPTIONS.map((months) => (
                <SelectItem key={months} value={String(months)}>
                  {months} months
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* Tabs: Assumptions / Levers / Variants / Compare / Decision */}
      <Tabs defaultValue="assumptions">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-4 px-0 h-auto pb-0">
          <TabsTrigger value="assumptions" className={TAB_TRIGGER_CLASS}>
            Assumptions
          </TabsTrigger>
          <TabsTrigger value="levers" className={TAB_TRIGGER_CLASS}>
            Levers
          </TabsTrigger>
          <TabsTrigger value="variants" className={TAB_TRIGGER_CLASS}>
            Variants
          </TabsTrigger>
          <TabsTrigger value="compare" className={TAB_TRIGGER_CLASS}>
            Compare
          </TabsTrigger>
          <TabsTrigger value="decision" className={TAB_TRIGGER_CLASS}>
            Decision
          </TabsTrigger>
        </TabsList>

        {/* Assumptions tab */}
        <TabsContent value="assumptions" className="mt-6">
          <AssumptionsEditor canEdit={canEdit} />
        </TabsContent>

        {/* Levers tab (formerly "Editor") */}
        <TabsContent value="levers" className="mt-6">
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

        {/* Variants tab */}
        <TabsContent value="variants" className="mt-6">
          <SectionVariants canEdit={canEdit} />
        </TabsContent>

        {/* Compare tab */}
        <TabsContent value="compare" className="mt-6">
          <ScenarioComparison />
        </TabsContent>

        {/* Decision tab (placeholder) */}
        <TabsContent value="decision" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Decision matrix -- coming in Plan 18-05
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
