import { atom } from 'jotai';
import type { SectionSlug, BusinessPlanSection } from '@/types';

// Active plan ID (default plan for single-user mode)
export const currentPlanIdAtom = atom('default');

// Section data atoms stored as a Map keyed by section slug
// Full Firestore sync will be wired in Phase 2 when section UIs are built
export const sectionDataMapAtom = atom<
  Map<SectionSlug, BusinessPlanSection | null>
>(new Map());

// Helper: get a specific section's data from the map
export const sectionDataAtom = (slug: SectionSlug) =>
  atom((get) => get(sectionDataMapAtom).get(slug) ?? null);
