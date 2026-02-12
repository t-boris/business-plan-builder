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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2 } from 'lucide-react';

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
    <div className={`flex flex-wrap items-center gap-2 ${!canEdit ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Scenario switcher */}
      {scenarioList.length > 0 && (
        <Select value={currentId} onValueChange={handleSwitch} disabled={!canEdit}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Select scenario" />
          </SelectTrigger>
          <SelectContent>
            {scenarioList.map((meta) => (
              <SelectItem key={meta.id} value={meta.id}>
                <span className="flex items-center gap-2">
                  {meta.name}
                  {meta.isBaseline && (
                    <span className="text-[10px] font-medium text-muted-foreground">(Baseline)</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Baseline badge */}
      {currentMeta?.isBaseline && (
        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
          Baseline
        </span>
      )}

      {/* Actions */}
      <Button variant="outline" size="sm" onClick={handleNew} disabled={!canEdit} className="h-7 text-xs">
        <Plus className="size-3.5" />
        New
      </Button>

      {canEdit && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={scenarioList.length <= 1 || isLoading}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete scenario?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{currentMeta?.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Loading indicator */}
      {isLoading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}

      {/* Offline indicator */}
      {isOffline && (
        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
          Offline
        </span>
      )}
    </div>
  );
}
