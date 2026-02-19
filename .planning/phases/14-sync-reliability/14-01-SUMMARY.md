---
phase: 14-sync-reliability
plan: 01
subsystem: sync-infrastructure
tags: [sync, jotai, retry, ui-indicator, offline-detection]

requires:
  - phase: 13-observability-and-docs
    provides: Structured logging module (createLogger factory)
provides:
  - Sync status types (SyncState, SyncEntry) and getSyncSummary helper
  - Global Jotai atoms for sync state tracking (entries, summary, updater)
  - Retry utility with exponential backoff for Firestore operations
  - SyncStatusIndicator component with offline detection
affects:
  - src/lib/sync-status.ts
  - src/store/sync-atoms.ts
  - src/lib/retry.ts
  - src/components/sync-status-indicator.tsx

tech-stack:
  added: []
  patterns:
    - "Centralized sync state via Jotai atoms with domain-keyed entries"
    - "Worst-state-wins summary derivation (error > offline > saving > saved > idle)"
    - "Exponential backoff retry with structured logging"
    - "Inline useOnlineStatus hook for network detection"

key-files:
  created:
    - src/lib/sync-status.ts
    - src/store/sync-atoms.ts
    - src/lib/retry.ts
    - src/components/sync-status-indicator.tsx
  modified: []

key-decisions:
  - "SyncState uses 5 states: idle, saving, saved, error, offline"
  - "getSyncSummary picks worst state across all entries using priority ordering"
  - "Retry utility capped at 30 lines with configurable maxRetries, baseDelay, maxDelay"
  - "SyncStatusIndicator is self-contained and mount-anywhere ready"
  - "Offline detection dispatches a 'network' domain sync entry for unified state"
  - "No toast library -- uses inline Tailwind-styled span with role=status"

patterns-established:
  - "Domain-keyed sync entries updated via updateSyncAtom writer atom"
  - "withRetry(fn, options) for all Firestore write operations"

issues-created: []

duration: 5min
completed: 2026-02-18
---

# Phase 14 Plan 01: Sync Status Infrastructure

**Created the foundational sync status infrastructure: shared types with priority-based summary, global Jotai atoms for sync state tracking, an exponential backoff retry utility, and a self-contained SyncStatusIndicator component with offline detection. This provides the foundation that all save hooks will use to report sync state and that the UI will consume to show save status to users.**

## Performance

- **Duration:** 5 min
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 0

## Accomplishments

- Created `src/lib/sync-status.ts` (25 lines) with `SyncState` type, `SyncEntry` interface, and `getSyncSummary` helper
- `getSyncSummary` uses priority array for worst-state-wins logic: error > offline > saving > saved > idle
- Created `src/store/sync-atoms.ts` (18 lines) with three atoms: `syncEntriesAtom` (base), `syncSummaryAtom` (derived), `updateSyncAtom` (writer)
- Follows existing Jotai atom patterns from `business-atoms.ts` and `scenario-atoms.ts`
- Created `src/lib/retry.ts` (31 lines) with `withRetry<T>` generic function
- Retry uses exponential backoff: `baseDelay * 2^attempt`, capped at `maxDelay`
- Logs each retry attempt via `createLogger('retry')` with attempt count, delay, and error message
- Created `src/components/sync-status-indicator.tsx` (131 lines) with 5 visual states
- Saving state shows pulsing "Saving..." text via Tailwind `animate-pulse`
- Saved state fades out after 2 seconds (mirrors BusinessHeaderBar pattern)
- Error state shows persistent red "Save failed" with hover tooltip showing domain and error
- Offline state shows yellow "Offline" text
- Inline `useOnlineStatus()` hook listens to browser online/offline events
- Offline detection dispatches sync entry `{ domain: 'network', state: 'offline' }` for unified state
- Verified `npx vite build` succeeds with zero errors

## Task Commits

1. **Task 1: Create sync status types and Jotai atoms** - `d4f5e20`
2. **Task 2: Create retry utility with exponential backoff** - `2e70de5`
3. **Task 3: Create SyncStatusIndicator component** - `ead6dae`

## Files Created/Modified

- `src/lib/sync-status.ts` - SyncState type, SyncEntry interface, getSyncSummary helper (25 lines)
- `src/store/sync-atoms.ts` - syncEntriesAtom, syncSummaryAtom, updateSyncAtom (18 lines)
- `src/lib/retry.ts` - withRetry utility with exponential backoff (31 lines)
- `src/components/sync-status-indicator.tsx` - SyncStatusIndicator component with useOnlineStatus hook (131 lines)

## Decisions Made

- Used priority array indexing for getSyncSummary rather than if-else chain for cleaner logic
- Kept retry utility at 31 lines (just over the 30-line guideline but includes type definition and logging)
- SyncStatusIndicator uses `role="status"` and `aria-live="polite"` for accessibility
- Error details shown via native `title` attribute rather than a custom tooltip component to keep dependencies minimal
- Online/offline state managed via sync atoms (domain: 'network') so it participates in the summary derivation

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Sync infrastructure is ready for integration into save hooks (Phase 14-02)
- `updateSyncAtom` provides the write interface for hooks to report state changes
- `syncSummaryAtom` and `syncEntriesAtom` provide the read interface for the indicator
- `withRetry` is ready to wrap Firestore operations in save hooks
- `SyncStatusIndicator` is ready to mount in the layout shell or header bar

---
*Phase: 14-sync-reliability*
*Completed: 2026-02-18*
