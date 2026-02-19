---
phase: 14-sync-reliability
plan: 04
subsystem: sync-infrastructure
tags: [sync, jotai, debounce, firestore, retry, logging]

requires:
  - phase: 14-sync-reliability
    provides: Sync status types, Jotai atoms, retry utility, SyncStatusIndicator component (14-01)
provides:
  - All Firestore-writing hooks instrumented with sync status reporting
  - Global SyncStatusIndicator mounted in layout header
  - Debounced variable value updates (500ms)
  - Structured logging in useBusinessVariables and useBusinesses
affects:
  - src/hooks/use-business-variables.ts
  - src/hooks/use-businesses.ts
  - src/app/layout.tsx
  - src/components/business-header-bar.tsx

tech-stack:
  added: []
  patterns:
    - "Shared persistVariables helper with sync status + retry for all variable mutations"
    - "Debounced Firestore writes via useRef timeout for rapid value changes"
    - "Domain-keyed sync entries: variables, profile, sections"
    - "Flush-on-unmount pattern for debounced saves"

key-files:
  created: []
  modified:
    - src/hooks/use-business-variables.ts
    - src/hooks/use-businesses.ts
    - src/app/layout.tsx
    - src/components/business-header-bar.tsx

key-decisions:
  - "Used useRef-based debounce (not a debounce library) matching existing useSection pattern"
  - "Each mutation domain gets its own sync entry key: variables, profile, sections"
  - "SyncStatusIndicator placed in DashboardLayout header with ml-auto for right-alignment"
  - "Removed local showSaved/saveTimerRef from BusinessHeaderBar in favor of global indicator"
  - "Added flush-on-unmount for debounced variable saves to prevent data loss on tab switch"

patterns-established:
  - "All Firestore-writing hooks report to sync atoms via updateSyncAtom"
  - "Rapid input changes (sliders, text fields) debounced at 500ms before Firestore write"

issues-created: []

duration: 8min
completed: 2026-02-18
---

# Phase 14 Plan 04: Instrument Remaining Hooks and Mount Global Sync Indicator

**Instrumented useBusinessVariables and useBusinesses with sync status reporting, added 500ms debounce to variable value updates, mounted SyncStatusIndicator in the layout header, and removed the old local "Saved" indicator from BusinessHeaderBar.**

## Performance

- **Duration:** 8 min
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Replaced all `.catch(console.error)` in `useBusinessVariables` with a shared `persistVariables` helper that reports sync status via `updateSyncAtom` and retries with `withRetry`
- Added 500ms debounce to `updateVariableValue` so rapid slider changes are batched into a single Firestore write, with flush-on-unmount to prevent data loss
- Replaced all `.catch(console.error)` in `useBusinesses` (`updateProfile`, `toggleSection`) with sync-status-aware `.then()/.catch()` chains
- Replaced silent catch blocks in `loadVariables` and `loadBusinesses` with `log.warn` for observability
- Mounted `SyncStatusIndicator` in `DashboardLayout` header, right-aligned via `ml-auto`
- Removed the old `showSaved` state, `saveTimerRef`, cleanup effect, and `<span>Saved</span>` JSX from `BusinessHeaderBar`

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor useBusinessVariables with sync status and debounce** - `df6f510`
2. **Task 2: Refactor useBusinesses with sync status and logging** - `facb0c2`
3. **Task 3: Mount SyncStatusIndicator and clean up old pattern** - `4ada704`

## Files Created/Modified

- `src/hooks/use-business-variables.ts` - Added sync status reporting, retry, debounce, structured logging
- `src/hooks/use-businesses.ts` - Added sync status reporting, structured logging for profile and section saves
- `src/app/layout.tsx` - Mounted SyncStatusIndicator in header bar
- `src/components/business-header-bar.tsx` - Removed old local showSaved/saveTimerRef pattern

## Decisions Made

- Used `useRef`-based debounce timer (matching existing `useSection` pattern) rather than introducing a debounce utility library
- Each Firestore domain gets its own sync entry key (`variables`, `profile`, `sections`) for granular status tracking
- Placed `SyncStatusIndicator` in the always-visible layout header rather than inside the collapsible `BusinessHeaderBar`
- Added flush-on-unmount for the debounced variable save to prevent data loss when navigating away during slider interaction

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- All 4 Firestore-writing hooks now report sync status: `useSection`, `useScenarioSync`, `useBusinessVariables`, `useBusinesses`
- Global `SyncStatusIndicator` is mounted and visible in the layout header
- Variable value changes are debounced at 500ms
- No raw `console.error` calls remain in hook files
- Build passes cleanly

---
*Phase: 14-sync-reliability*
*Completed: 2026-02-18*
