import { atom } from 'jotai';
import type { ScenarioMetadata, DynamicScenario, ScenarioAssumption, ScenarioStatus } from '@/types';

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

// --- v2 Scenario Atoms (Phase 18) ---

// Scenario status: draft | active | archived
export const scenarioStatusAtom = atom<ScenarioStatus>('draft');

// Planning horizon in months
export const scenarioHorizonAtom = atom<number>(12);

// Structured assumptions for the current scenario
export const scenarioAssumptionsAtom = atom<ScenarioAssumption[]>([]);

// Maps section slug to variant document ID for the active scenario
export const scenarioVariantRefsAtom = atom<Record<string, string>>({});

// Maps section slug to partial section data overrides for the active scenario
export const scenarioSectionOverridesAtom = atom<Record<string, Record<string, unknown>>>({});

// Read-only atom that returns all explicit overrides from the current scenario.
// Includes both lever keys and custom variable keys.
// Only non-empty values are saved (empty = use base from section scope).
export const snapshotInputValuesAtom = atom<Record<string, number>>((get) => {
  return get(scenarioValuesAtom);
});

// Writable atom that loads a DynamicScenario into the dynamic atoms
export const loadDynamicScenarioAtom = atom<null, [DynamicScenario], void>(
  null,
  (_get, set, scenario) => {
    set(scenarioNameAtom, scenario.metadata.name);
    set(currentScenarioIdAtom, scenario.metadata.id);
    set(scenarioValuesAtom, scenario.values);
    // v2 fields
    set(scenarioAssumptionsAtom, scenario.assumptions ?? []);
    set(scenarioVariantRefsAtom, scenario.variantRefs ?? {});
    set(scenarioSectionOverridesAtom, scenario.sectionOverrides ?? {});
    set(scenarioStatusAtom, scenario.status ?? 'draft');
    set(scenarioHorizonAtom, scenario.horizonMonths ?? 12);
  }
);

// Writable atom that resets dynamic atoms for a new scenario.
// Starts with EMPTY values so all inputs derive from section scope (current reality).
// Only explicit user overrides get stored.
export const resetDynamicToDefaultsAtom = atom<null, [], void>(
  null,
  (_get, set) => {
    set(scenarioNameAtom, 'New Scenario');
    set(currentScenarioIdAtom, crypto.randomUUID());
    set(scenarioValuesAtom, {});
    // v2 fields
    set(scenarioAssumptionsAtom, []);
    set(scenarioVariantRefsAtom, {});
    set(scenarioSectionOverridesAtom, {});
    set(scenarioStatusAtom, 'draft');
    set(scenarioHorizonAtom, 12);
  }
);
