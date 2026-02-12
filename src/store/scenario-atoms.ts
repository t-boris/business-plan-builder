import { atom } from 'jotai';
import { DEFAULT_SCENARIO_VARIABLES } from '@/lib/constants.ts';
import type { ScenarioMetadata, ScenarioVariables, Scenario } from '@/types';

// Scenario name
export const scenarioNameAtom = atom<string>('Baseline');

// Pricing tier atoms
export const priceTier1Atom = atom<number>(DEFAULT_SCENARIO_VARIABLES.priceTier1);
export const priceTier2Atom = atom<number>(DEFAULT_SCENARIO_VARIABLES.priceTier2);
export const priceTier3Atom = atom<number>(DEFAULT_SCENARIO_VARIABLES.priceTier3);

// Lead & conversion atoms
export const monthlyLeadsAtom = atom<number>(DEFAULT_SCENARIO_VARIABLES.monthlyLeads);
export const conversionRateAtom = atom<number>(
  DEFAULT_SCENARIO_VARIABLES.conversionRate
);
export const cacPerLeadAtom = atom<number>(DEFAULT_SCENARIO_VARIABLES.cacPerLead);

// Marketing budget atoms (per channel)
export const monthlyAdBudgetMetaAtom = atom<number>(
  DEFAULT_SCENARIO_VARIABLES.monthlyAdBudgetMeta
);
export const monthlyAdBudgetGoogleAtom = atom<number>(
  DEFAULT_SCENARIO_VARIABLES.monthlyAdBudgetGoogle
);

// Operations atoms
export const staffCountAtom = atom<number>(DEFAULT_SCENARIO_VARIABLES.staffCount);
export const costPerUnitAtom = atom<number>(DEFAULT_SCENARIO_VARIABLES.costPerUnit);

// --- Scenario Management Atoms ---

// Flag to prevent auto-save during initial load
export const scenarioSyncReadyAtom = atom<boolean>(false);

// Current active scenario ID
export const currentScenarioIdAtom = atom<string>('baseline');

// List of saved scenario metadata (loaded from Firestore)
export const scenarioListAtom = atom<ScenarioMetadata[]>([]);

// Read-only atom that snapshots all current primitive atoms into a ScenarioVariables object
export const snapshotScenarioAtom = atom<ScenarioVariables>((get) => ({
  priceTier1: get(priceTier1Atom),
  priceTier2: get(priceTier2Atom),
  priceTier3: get(priceTier3Atom),
  monthlyLeads: get(monthlyLeadsAtom),
  conversionRate: get(conversionRateAtom),
  cacPerLead: get(cacPerLeadAtom),
  monthlyAdBudgetMeta: get(monthlyAdBudgetMetaAtom),
  monthlyAdBudgetGoogle: get(monthlyAdBudgetGoogleAtom),
  staffCount: get(staffCountAtom),
  costPerUnit: get(costPerUnitAtom),
  bookingsPerMonth: Math.round(get(monthlyLeadsAtom) * get(conversionRateAtom)),
}));

// Writable atom that loads a full scenario into all primitive atoms
export const loadScenarioAtom = atom<null, [Scenario], void>(
  null,
  (_get, set, scenario) => {
    const v = scenario.variables;
    set(scenarioNameAtom, scenario.metadata.name);
    set(currentScenarioIdAtom, scenario.metadata.id);
    set(priceTier1Atom, v.priceTier1);
    set(priceTier2Atom, v.priceTier2);
    set(priceTier3Atom, v.priceTier3);
    set(monthlyLeadsAtom, v.monthlyLeads);
    set(conversionRateAtom, v.conversionRate);
    set(cacPerLeadAtom, v.cacPerLead);
    set(monthlyAdBudgetMetaAtom, v.monthlyAdBudgetMeta);
    set(monthlyAdBudgetGoogleAtom, v.monthlyAdBudgetGoogle);
    set(staffCountAtom, v.staffCount);
    set(costPerUnitAtom, v.costPerUnit);
  }
);

// Writable atom that resets all atoms to defaults for a new scenario
export const resetToDefaultsAtom = atom<null, [], void>(
  null,
  (_get, set) => {
    set(scenarioNameAtom, 'New Scenario');
    set(currentScenarioIdAtom, crypto.randomUUID());
    set(priceTier1Atom, DEFAULT_SCENARIO_VARIABLES.priceTier1);
    set(priceTier2Atom, DEFAULT_SCENARIO_VARIABLES.priceTier2);
    set(priceTier3Atom, DEFAULT_SCENARIO_VARIABLES.priceTier3);
    set(monthlyLeadsAtom, DEFAULT_SCENARIO_VARIABLES.monthlyLeads);
    set(conversionRateAtom, DEFAULT_SCENARIO_VARIABLES.conversionRate);
    set(cacPerLeadAtom, DEFAULT_SCENARIO_VARIABLES.cacPerLead);
    set(monthlyAdBudgetMetaAtom, DEFAULT_SCENARIO_VARIABLES.monthlyAdBudgetMeta);
    set(monthlyAdBudgetGoogleAtom, DEFAULT_SCENARIO_VARIABLES.monthlyAdBudgetGoogle);
    set(staffCountAtom, DEFAULT_SCENARIO_VARIABLES.staffCount);
    set(costPerUnitAtom, DEFAULT_SCENARIO_VARIABLES.costPerUnit);
  }
);
