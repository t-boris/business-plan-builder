import { useCallback, useEffect, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  scenarioNameAtom,
  currentScenarioIdAtom,
  scenarioListAtom,
  snapshotScenarioAtom,
  loadScenarioAtom,
  resetToDefaultsAtom,
} from '@/store/scenario-atoms.ts';
import {
  saveScenario,
  listScenarios,
  deleteScenario,
} from '@/lib/firestore.ts';
import type { Scenario } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Plus, Trash2 } from 'lucide-react';

const PLAN_ID = 'default';

export function ScenarioManager() {
  const [scenarioName] = useAtom(scenarioNameAtom);
  const [currentId] = useAtom(currentScenarioIdAtom);
  const [scenarioList, setScenarioList] = useAtom(scenarioListAtom);
  const variables = useAtomValue(snapshotScenarioAtom);
  const loadScenario = useSetAtom(loadScenarioAtom);
  const resetToDefaults = useSetAtom(resetToDefaultsAtom);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Load scenario list from Firestore on mount
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    listScenarios(PLAN_ID)
      .then((scenarios) => {
        if (!mounted) return;
        const metadataList = scenarios.map((s) => s.metadata);
        setScenarioList(metadataList);

        // If we have saved scenarios, load the first one (or baseline)
        if (scenarios.length > 0) {
          const baseline = scenarios.find((s) => s.metadata.isBaseline) ?? scenarios[0];
          loadScenario(baseline);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsOffline(true);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [setScenarioList, loadScenario]);

  // Save current scenario
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const scenario: Scenario = {
        metadata: {
          id: currentId,
          name: scenarioName,
          description: '',
          createdAt: new Date().toISOString(),
          isBaseline: currentId === 'baseline',
        },
        variables,
      };

      await saveScenario(PLAN_ID, scenario);

      // Update list
      setScenarioList((prev) => {
        const exists = prev.find((m) => m.id === currentId);
        if (exists) {
          return prev.map((m) => (m.id === currentId ? scenario.metadata : m));
        }
        return [...prev, scenario.metadata];
      });
    } catch {
      setIsOffline(true);
    } finally {
      setIsSaving(false);
    }
  }, [currentId, scenarioName, variables, setScenarioList]);

  // Switch to a different scenario
  const handleSwitch = useCallback(
    async (scenarioId: string) => {
      setIsLoading(true);
      try {
        const scenarios = await listScenarios(PLAN_ID);
        const target = scenarios.find((s) => s.metadata.id === scenarioId);
        if (target) {
          loadScenario(target);
        }
      } catch {
        setIsOffline(true);
      } finally {
        setIsLoading(false);
      }
    },
    [loadScenario]
  );

  // Create new scenario (reset to defaults)
  const handleNew = useCallback(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  // Delete current scenario
  const handleDelete = useCallback(async () => {
    if (scenarioList.length <= 1) return; // Cannot delete the only scenario

    try {
      await deleteScenario(PLAN_ID, currentId);
      const updatedList = scenarioList.filter((m) => m.id !== currentId);
      setScenarioList(updatedList);

      // Switch to first remaining scenario
      if (updatedList.length > 0) {
        await handleSwitch(updatedList[0].id);
      }
    } catch {
      setIsOffline(true);
    }
  }, [currentId, scenarioList, setScenarioList, handleSwitch]);

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
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save className="size-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        <Button variant="outline" size="sm" onClick={handleNew}>
          <Plus className="size-4 mr-1" />
          New
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={scenarioList.length <= 1 || isLoading}
        >
          <Trash2 className="size-4 mr-1" />
          Delete
        </Button>
      </div>

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
