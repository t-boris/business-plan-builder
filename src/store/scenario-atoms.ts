import { atom } from 'jotai';
import type { ScenarioMetadata, DynamicScenario } from '@/types';
import { businessVariablesAtom } from '@/store/business-atoms.ts';

// Scenario name
export const scenarioNameAtom = atom<string>('Baseline');

// --- Scenario Management Atoms ---

// Flag to prevent auto-save during initial load
export const scenarioSyncReadyAtom = atom<boolean>(false);

// Current active scenario ID
export const currentScenarioIdAtom = atom<string>('baseline');

// List of saved scenario metadata (loaded from Firestore)
export const scenarioListAtom = atom<ScenarioMetadata[]>([]);

// --- Dynamic Scenario Atoms (Phase 7) ---

// Stores current scenario's input variable values, keyed by variable ID
export const scenarioValuesAtom = atom<Record<string, number>>({});

// Read-only atom that filters scenarioValuesAtom to only input variable values
export const snapshotInputValuesAtom = atom<Record<string, number>>((get) => {
  const definitions = get(businessVariablesAtom);
  if (!definitions) return {};
  const values = get(scenarioValuesAtom);
  const result: Record<string, number> = {};
  for (const [id, def] of Object.entries(definitions)) {
    if (def.type === 'input') {
      result[id] = values[id] ?? def.value;
    }
  }
  return result;
});

// Writable atom that loads a DynamicScenario into the dynamic atoms
export const loadDynamicScenarioAtom = atom<null, [DynamicScenario], void>(
  null,
  (_get, set, scenario) => {
    set(scenarioNameAtom, scenario.metadata.name);
    set(currentScenarioIdAtom, scenario.metadata.id);
    set(scenarioValuesAtom, scenario.values);
  }
);

// Writable atom that resets dynamic atoms to defaults from businessVariablesAtom
export const resetDynamicToDefaultsAtom = atom<null, [], void>(
  null,
  (get, set) => {
    const definitions = get(businessVariablesAtom);
    const defaults: Record<string, number> = {};
    if (definitions) {
      for (const [id, def] of Object.entries(definitions)) {
        if (def.type === 'input') {
          defaults[id] = def.defaultValue;
        }
      }
    }
    set(scenarioNameAtom, 'New Scenario');
    set(currentScenarioIdAtom, crypto.randomUUID());
    set(scenarioValuesAtom, defaults);
  }
);
