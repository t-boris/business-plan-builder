import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  snapshotInputValuesAtom,
  scenarioNameAtom,
  currentScenarioIdAtom,
  scenarioListAtom,
  scenarioSyncReadyAtom,
} from '@/store/scenario-atoms';
import { activeBusinessIdAtom } from '@/store/business-atoms';
import { updateSyncAtom } from '@/store/sync-atoms';
import { saveScenarioData, saveScenarioPreferences } from '@/lib/business-firestore';
import { withRetry } from '@/lib/retry';
import { createLogger } from '@/lib/logger';
import type { DynamicScenario, ScenarioMetadata } from '@/types';

const log = createLogger('scenario');

function metadataEqual(a: ScenarioMetadata, b: ScenarioMetadata): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.description === b.description &&
    a.createdAt === b.createdAt &&
    a.isBaseline === b.isBaseline
  );
}

export function useScenarioSync() {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const inputValues = useAtomValue(snapshotInputValuesAtom);
  const scenarioName = useAtomValue(scenarioNameAtom);
  const currentId = useAtomValue(currentScenarioIdAtom);
  const scenarioList = useAtomValue(scenarioListAtom);
  const syncReady = useAtomValue(scenarioSyncReadyAtom);
  const setScenarioList = useSetAtom(scenarioListAtom);
  const setSyncStatus = useSetAtom(updateSyncAtom);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the last-saved list to avoid re-trigger loops
  const lastSavedListRef = useRef<ScenarioMetadata[]>(scenarioList);

  // Keep the ref in sync with the atom value (for reading inside the debounce callback)
  const scenarioListRef = useRef(scenarioList);
  scenarioListRef.current = scenarioList;

  const save = useCallback(async () => {
    if (!businessId) return;

    const currentList = scenarioListRef.current;
    const existingMeta = currentList.find((m) => m.id === currentId);

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

    setSyncStatus({ domain: 'scenario', state: 'saving' });
    try {
      await withRetry(() =>
        Promise.all([
          saveScenarioData(businessId, scenario),
          saveScenarioPreferences(businessId, { activeScenarioId: currentId }),
        ])
      );
      setSyncStatus({ domain: 'scenario', state: 'saved', lastSaved: Date.now() });
      log.info('saved', { businessId, scenarioId: currentId });

      // Update scenario list metadata after successful save, only if metadata actually changed
      setScenarioList((prev) => {
        const exists = prev.find((m) => m.id === currentId);
        if (exists) {
          if (metadataEqual(exists, scenario.metadata)) {
            return prev; // No change — avoid re-trigger
          }
          const updated = prev.map((m) =>
            m.id === currentId ? scenario.metadata : m
          );
          lastSavedListRef.current = updated;
          return updated;
        }
        const updated = [...prev, scenario.metadata];
        lastSavedListRef.current = updated;
        return updated;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scenario save failed';
      setSyncStatus({ domain: 'scenario', state: 'error', error: message });
      log.error('save.failed', { businessId, scenarioId: currentId, error: message });
    }
  }, [businessId, currentId, scenarioName, inputValues, setSyncStatus, setScenarioList]);

  // Auto-save on any variable/name/id change (debounced 500ms)
  useEffect(() => {
    if (!syncReady) return;
    if (!businessId) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      save();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValues, scenarioName, currentId, syncReady, businessId, save]);
}
