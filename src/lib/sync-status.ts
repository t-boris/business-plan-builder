export type SyncState = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export interface SyncEntry {
  domain: string;      // e.g. 'section', 'scenario', 'variables', 'profile'
  state: SyncState;
  error?: string;
  lastSaved?: number;  // Date.now() timestamp
}

/** Priority order: higher index = worse state */
const PRIORITY: SyncState[] = ['idle', 'saved', 'saving', 'offline', 'error'];

/**
 * Returns the worst sync state across all entries.
 * Priority: error > offline > saving > saved > idle
 */
export function getSyncSummary(entries: SyncEntry[]): SyncState {
  if (entries.length === 0) return 'idle';

  let worst = 0;
  for (const entry of entries) {
    const idx = PRIORITY.indexOf(entry.state);
    if (idx > worst) worst = idx;
  }
  return PRIORITY[worst];
}
