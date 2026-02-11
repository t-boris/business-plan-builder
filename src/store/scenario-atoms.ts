import { atom } from 'jotai';
import { DEFAULT_SCENARIO_VARIABLES } from '@/lib/constants.ts';
import type { ScenarioMetadata, ScenarioVariables, Scenario } from '@/types';

// Scenario name
export const scenarioNameAtom = atom<string>('Baseline');

// Package pricing atoms
export const priceStarterAtom = atom<number>(DEFAULT_SCENARIO_VARIABLES.priceStarter);
export const priceExplorerAtom = atom<number>(DEFAULT_SCENARIO_VARIABLES.priceExplorer);
export const priceVIPAtom = atom<number>(DEFAULT_SCENARIO_VARIABLES.priceVIP);

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
export const crewCountAtom = atom<number>(DEFAULT_SCENARIO_VARIABLES.crewCount);
export const costPerEventAtom = atom<number>(DEFAULT_SCENARIO_VARIABLES.costPerEvent);

// --- Scenario Management Atoms ---

// Current active scenario ID
export const currentScenarioIdAtom = atom<string>('baseline');

// List of saved scenario metadata (loaded from Firestore)
export const scenarioListAtom = atom<ScenarioMetadata[]>([]);

// Read-only atom that snapshots all current primitive atoms into a ScenarioVariables object
export const snapshotScenarioAtom = atom<ScenarioVariables>((get) => ({
  priceStarter: get(priceStarterAtom),
  priceExplorer: get(priceExplorerAtom),
  priceVIP: get(priceVIPAtom),
  monthlyLeads: get(monthlyLeadsAtom),
  conversionRate: get(conversionRateAtom),
  cacPerLead: get(cacPerLeadAtom),
  monthlyAdBudgetMeta: get(monthlyAdBudgetMetaAtom),
  monthlyAdBudgetGoogle: get(monthlyAdBudgetGoogleAtom),
  crewCount: get(crewCountAtom),
  costPerEvent: get(costPerEventAtom),
  bookingsPerMonth: Math.round(get(monthlyLeadsAtom) * get(conversionRateAtom)),
}));

// Writable atom that loads a full scenario into all primitive atoms
export const loadScenarioAtom = atom<null, [Scenario], void>(
  null,
  (_get, set, scenario) => {
    const v = scenario.variables;
    set(scenarioNameAtom, scenario.metadata.name);
    set(currentScenarioIdAtom, scenario.metadata.id);
    set(priceStarterAtom, v.priceStarter);
    set(priceExplorerAtom, v.priceExplorer);
    set(priceVIPAtom, v.priceVIP);
    set(monthlyLeadsAtom, v.monthlyLeads);
    set(conversionRateAtom, v.conversionRate);
    set(cacPerLeadAtom, v.cacPerLead);
    set(monthlyAdBudgetMetaAtom, v.monthlyAdBudgetMeta);
    set(monthlyAdBudgetGoogleAtom, v.monthlyAdBudgetGoogle);
    set(crewCountAtom, v.crewCount);
    set(costPerEventAtom, v.costPerEvent);
  }
);

// Writable atom that resets all atoms to defaults for a new scenario
export const resetToDefaultsAtom = atom<null, [], void>(
  null,
  (_get, set) => {
    set(scenarioNameAtom, 'New Scenario');
    set(currentScenarioIdAtom, crypto.randomUUID());
    set(priceStarterAtom, DEFAULT_SCENARIO_VARIABLES.priceStarter);
    set(priceExplorerAtom, DEFAULT_SCENARIO_VARIABLES.priceExplorer);
    set(priceVIPAtom, DEFAULT_SCENARIO_VARIABLES.priceVIP);
    set(monthlyLeadsAtom, DEFAULT_SCENARIO_VARIABLES.monthlyLeads);
    set(conversionRateAtom, DEFAULT_SCENARIO_VARIABLES.conversionRate);
    set(cacPerLeadAtom, DEFAULT_SCENARIO_VARIABLES.cacPerLead);
    set(monthlyAdBudgetMetaAtom, DEFAULT_SCENARIO_VARIABLES.monthlyAdBudgetMeta);
    set(monthlyAdBudgetGoogleAtom, DEFAULT_SCENARIO_VARIABLES.monthlyAdBudgetGoogle);
    set(crewCountAtom, DEFAULT_SCENARIO_VARIABLES.crewCount);
    set(costPerEventAtom, DEFAULT_SCENARIO_VARIABLES.costPerEvent);
  }
);
