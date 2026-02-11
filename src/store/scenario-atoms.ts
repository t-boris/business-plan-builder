import { atom } from 'jotai';
import { DEFAULT_SCENARIO_VARIABLES } from '@/lib/constants.ts';

// Scenario name
export const scenarioNameAtom = atom('Baseline');

// Package pricing atoms
export const priceStarterAtom = atom(DEFAULT_SCENARIO_VARIABLES.priceStarter);
export const priceExplorerAtom = atom(DEFAULT_SCENARIO_VARIABLES.priceExplorer);
export const priceVIPAtom = atom(DEFAULT_SCENARIO_VARIABLES.priceVIP);

// Lead & conversion atoms
export const monthlyLeadsAtom = atom(DEFAULT_SCENARIO_VARIABLES.monthlyLeads);
export const conversionRateAtom = atom(
  DEFAULT_SCENARIO_VARIABLES.conversionRate
);
export const cacPerLeadAtom = atom(DEFAULT_SCENARIO_VARIABLES.cacPerLead);

// Marketing budget atoms (per channel)
export const monthlyAdBudgetMetaAtom = atom(
  DEFAULT_SCENARIO_VARIABLES.monthlyAdBudgetMeta
);
export const monthlyAdBudgetGoogleAtom = atom(
  DEFAULT_SCENARIO_VARIABLES.monthlyAdBudgetGoogle
);

// Operations atoms
export const crewCountAtom = atom(DEFAULT_SCENARIO_VARIABLES.crewCount);
export const costPerEventAtom = atom(DEFAULT_SCENARIO_VARIABLES.costPerEvent);
