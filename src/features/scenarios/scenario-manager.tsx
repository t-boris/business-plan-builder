import { useCallback, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  currentScenarioIdAtom,
  scenarioListAtom,
  loadDynamicScenarioAtom,
  resetDynamicToDefaultsAtom,
} from '@/store/scenario-atoms.ts';
import {
  listScenarioData,
  deleteScenarioData,
  saveScenarioPreferences,
} from '@/lib/business-firestore';
import { activeBusinessIdAtom } from '@/store/business-atoms';
import { useCanEdit } from '@/hooks/use-business-role';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export function ScenarioManager() {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const [currentId] = useAtom(currentScenarioIdAtom);
  const scenarioList = useAtomValue(scenarioListAtom);
  const setScenarioList = useSetAtom(scenarioListAtom);
  const loadDynamicScenario = useSetAtom(loadDynamicScenarioAtom);
  const resetDynamicToDefaults = useSetAtom(resetDynamicToDefaultsAtom);

  const canEdit = useCanEdit();
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Switch to a different scenario
  const handleSwitch = useCallback(
    async (scenarioId: string) => {
      if (!businessId) return;
      setIsLoading(true);
      try {
        const scenarios = await listScenarioData(businessId);
        const target = scenarios.find((s) => s.metadata.id === scenarioId);
        if (target) {
          loadDynamicScenario(target);
          await saveScenarioPreferences(businessId, { activeScenarioId: scenarioId });
        }
      } catch {
        setIsOffline(true);
      } finally {
        setIsLoading(false);
      }
    },
    [businessId, loadDynamicScenario]
  );

  // Create new scenario (reset to defaults)
  const handleNew = useCallback(() => {
    resetDynamicToDefaults();
  }, [resetDynamicToDefaults]);

  // Delete current scenario
  const handleDelete = useCallback(async () => {
    if (!businessId) return;
    if (scenarioList.length <= 1) return;

    try {
      await deleteScenarioData(businessId, currentId);
      const updatedList = scenarioList.filter((m) => m.id !== currentId);
      setScenarioList(updatedList);

      // Switch to first remaining scenario
      if (updatedList.length > 0) {
        await handleSwitch(updatedList[0].id);
      }
    } catch {
      setIsOffline(true);
    }
  }, [businessId, currentId, scenarioList, setScenarioList, handleSwitch]);

  const currentMeta = scenarioList.find((m) => m.id === currentId);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      {/* Scenario switcher */}
      {scenarioList.length > 0 && (
        <Select value={currentId} onValueChange={handleSwitch}>
          <SelectTrigger className="w-[200px] h-8 text-sm">
            <SelectValue placeholder="Select scenario" />
          </SelectTrigger>
          <SelectContent>
            {scenarioList.map((meta) => (
              <SelectItem key={meta.id} value={meta.id}>
                {meta.name}
                {meta.isBaseline && ' (Baseline)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Baseline badge */}
      {currentMeta?.isBaseline && (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          Baseline
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="outline" size="sm" onClick={handleNew} disabled={!canEdit}>
          <Plus className="size-4 mr-1" />
          New
        </Button>

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={scenarioList.length <= 1 || isLoading}
          >
            <Trash2 className="size-4 mr-1" />
            Delete
          </Button>
        )}
      </div>

      {/* Auto-save indicator */}
      <span className="text-xs text-muted-foreground">Auto-saved</span>

      {/* Offline indicator */}
      {isOffline && (
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          Offline mode
        </span>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <span className="text-xs text-muted-foreground">Loading...</span>
      )}
    </div>
  );
}
