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
