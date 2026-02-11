import { atom } from 'jotai';
import { DEFAULT_SCENARIO_VARIABLES } from '@/lib/constants.ts';

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
