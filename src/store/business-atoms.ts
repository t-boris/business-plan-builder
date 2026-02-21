import { atom } from 'jotai';
import type { Business, VariableDefinition } from '@/types';

// The list of businesses the current user has access to
export const businessListAtom = atom<Business[]>([]);

// Whether business list has been loaded from Firestore
export const businessesLoadedAtom = atom(false);

// Active business ID (persisted to localStorage for session continuity)
// On init, read from localStorage. On change, write to localStorage.
// Note: localStorage read/write is handled by the useBusinesses hook, not here.
export const activeBusinessIdAtom = atom<string | null>(null);

// Derived: the active Business object from the list
export const activeBusinessAtom = atom<Business | null>((get) => {
  const id = get(activeBusinessIdAtom);
  const list = get(businessListAtom);
  if (!id) return null;
  return list.find((b) => b.id === id) ?? null;
});

// Derived: loading state (not yet loaded)
export const businessesLoadingAtom = atom((get) => !get(businessesLoadedAtom));

// Business variable definitions for the active business
export const businessVariablesAtom = atom<Record<string, VariableDefinition> | null>(null);

// Whether variables have been loaded from Firestore for the active business
export const businessVariablesLoadedAtom = atom<boolean>(false);

// Whether the most recent variable load attempt failed (Firestore error)
export const businessVariablesLoadFailedAtom = atom<boolean>(false);

// Section-derived scope: computed metrics from actual section data (Operations, Financial Projections, etc.)
// Updated by SectionScopeLoader in providers.tsx. Used by evaluatedValuesAtom to inject
// real data into the formula engine so variables stay in sync with section data.
export const sectionDerivedScopeAtom = atom<Record<string, number>>({});

// Bump this to trigger a section scope reload (e.g., after a section save)
export const sectionScopeVersionAtom = atom<number>(0);

// Season coefficients from Financial Projections (12 values, 1.0 = average month)
export const seasonCoefficientsAtom = atom<number[]>(Array(12).fill(1));
