import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  snapshotInputValuesAtom,
  scenarioNameAtom,
  currentScenarioIdAtom,
  scenarioListAtom,
  scenarioSyncReadyAtom,
} from '@/store/scenario-atoms';
import { activeBusinessIdAtom } from '@/store/business-atoms';
import { saveScenarioData, saveScenarioPreferences } from '@/lib/business-firestore';
import type { DynamicScenario } from '@/types';

export function useScenarioSync() {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const inputValues = useAtomValue(snapshotInputValuesAtom);
  const scenarioName = useAtomValue(scenarioNameAtom);
  const currentId = useAtomValue(currentScenarioIdAtom);
  const scenarioList = useAtomValue(scenarioListAtom);
  const syncReady = useAtomValue(scenarioSyncReadyAtom);
  const setScenarioList = useSetAtom(scenarioListAtom);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save on any variable/name/id change (debounced 500ms)
  useEffect(() => {
    if (!syncReady) return;
    if (!businessId) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      const existingMeta = scenarioList.find((m) => m.id === currentId);

      const scenario: DynamicScenario = {
        metadata: {
          id: currentId,
          name: scenarioName,
          description: existingMeta?.description ?? '',
          createdAt: existingMeta?.createdAt ?? new Date().toISOString(),
          isBaseline: existingMeta?.isBaseline ?? currentId === 'baseline',
        },
        values: inputValues,
      };

      try {
        await Promise.all([
          saveScenarioData(businessId, scenario),
          saveScenarioPreferences(businessId, { activeScenarioId: currentId }),
        ]);

        // Update scenario list metadata after successful save
        setScenarioList((prev) => {
          const exists = prev.find((m) => m.id === currentId);
          if (exists) {
            return prev.map((m) =>
              m.id === currentId ? scenario.metadata : m
            );
          }
          return [...prev, scenario.metadata];
        });
      } catch {
        // Firestore may not be available — silently fail
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValues, scenarioName, currentId, syncReady, businessId, scenarioList, setScenarioList]);
}
