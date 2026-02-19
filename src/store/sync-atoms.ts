import { atom } from 'jotai';
import { getSyncSummary } from '@/lib/sync-status';
import type { SyncEntry } from '@/lib/sync-status';

// Map of domain -> SyncEntry
export const syncEntriesAtom = atom<Record<string, SyncEntry>>({});

// Derived: overall sync state
export const syncSummaryAtom = atom((get) =>
  getSyncSummary(Object.values(get(syncEntriesAtom)))
);

// Writer atom: update a single domain's sync state
export const updateSyncAtom = atom(null, (get, set, update: SyncEntry) => {
  set(syncEntriesAtom, { ...get(syncEntriesAtom), [update.domain]: update });
});
