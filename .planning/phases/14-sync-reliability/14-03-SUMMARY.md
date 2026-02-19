---
phase: 14-sync-reliability
plan: 03
subsystem: scenario-sync, providers
tags: [sync, retry, logging, race-condition, jotai]

requires:
  - phase: 14-sync-reliability
    plan: 01
    provides: Sync status atoms, withRetry utility, createLogger
provides:
  - useScenarioSync with sync status reporting, retry, and structured logging
  - providers.tsx load-failure race condition fix (no blank baseline writes)
  - businessVariablesLoadFailedAtom for tracking variable load failures
affects:
  - src/hooks/use-scenario-sync.ts
  - src/app/providers.tsx
  - src/store/business-atoms.ts

tech-stack:
  added: []
  patterns:
    - "Sync status reporting via updateSyncAtom in save hooks"
    - "withRetry wrapping for all Firestore save operations"
    - "Metadata comparison before atom updates to prevent re-trigger loops"
    - "Load-failure flag atoms to guard downstream write operations"

key-files:
  created: []
  modified:
    - src/hooks/use-scenario-sync.ts
    - src/app/providers.tsx
    - src/store/business-atoms.ts

key-decisions:
  - "Extracted save logic into a useCallback to separate concerns from debounce effect"
  - "Used metadataEqual helper to compare ScenarioMetadata and avoid unnecessary setScenarioList updates"
  - "Removed scenarioList from useEffect deps to prevent re-trigger loop; read via ref instead"
  - "Used a Jotai atom (businessVariablesLoadFailedAtom) to thread load-failure state between sibling components"
  - "ScenarioSync skips baseline creation when variables is null or load failed, logs warning instead"
  - "All catch blocks now use structured logging instead of silent failures"

patterns-established:
  - "Load-failure flag atom pattern for guarding downstream writes"
  - "Ref-based dep array fix to avoid stale-closure loops in debounced effects"

issues-created: []

duration: 8min
completed: 2026-02-18
---

# Phase 14 Plan 03: Scenario Sync & Providers Race Condition Fix

**Refactored useScenarioSync to report sync status via atoms, retry failed saves with exponential backoff, and log all operations. Fixed the providers.tsx race condition where VariableLoader failures could trigger blank baseline writes to Firestore.**

## Performance

- **Duration:** 8 min
- **Tasks:** 2
- **Files created:** 0
- **Files modified:** 3

## Accomplishments

### Task 1: useScenarioSync refactor
- Added sync status reporting: `setSyncStatus({ domain: 'scenario', state: 'saving' })` before save, `saved` on success, `error` on failure
- Wrapped Firestore save with `withRetry()` for automatic retry with exponential backoff
- Added structured logging via `createLogger('scenario')` for save success and failure
- Fixed scenarioList dep array re-trigger: extracted save logic into `useCallback`, read `scenarioList` via ref, and added `metadataEqual` comparison to skip no-op updates
- Removed `scenarioList` and `setScenarioList` from the effect dependency array to prevent the save-triggers-list-update-triggers-save loop

### Task 2: providers.tsx load-failure race condition
- Added `businessVariablesLoadFailedAtom` to `src/store/business-atoms.ts`
- VariableLoader now sets `loadFailed` flag on catch, logs warning with `log.warn('variables.load.failed', ...)`
- VariableLoader resets `loadFailed` to false on successful load and on business change
- ScenarioSync now checks `variableLoadFailed` before creating baseline: `if (scenarios.length === 0 && variables && !variableLoadFailed)`
- When variables failed and no scenarios exist, logs `log.warn('baseline.skipped', ...)` and proceeds without writing
- ScenarioSync catch block now logs `log.warn('scenarios.load.failed', ...)` instead of silent catch
- No silent catch blocks remain in either component

## Task Commits

1. **Task 1: Refactor useScenarioSync with sync status and logging** - `9cdfb10`
2. **Task 2: Fix providers.tsx load-failure race condition** - `1500145`

## Files Created/Modified

- `src/hooks/use-scenario-sync.ts` - Complete refactor: sync atoms, withRetry, logging, dep array fix (104 lines, was 75)
- `src/app/providers.tsx` - Load-failure guard, structured logging, variableLoadFailed threading (192 lines, was 192)
- `src/store/business-atoms.ts` - Added businessVariablesLoadFailedAtom (33 lines, was 30)

## Decisions Made

- Used `useCallback` for the save function to cleanly separate save logic from the debounce effect, making deps explicit
- Used a ref (`scenarioListRef`) to read current scenarioList inside the debounced save without adding it to deps
- Chose a Jotai atom over React context or prop drilling for the loadFailed flag since VariableLoader and ScenarioSync are siblings
- Reset `loadFailed` to false both on successful load and on business change to ensure clean state
- Kept existing 500ms debounce timing unchanged

## Deviations from Plan

- Plan suggested saving `scenarioList` inside `saveScenarioPreferences`. The existing code does not include scenarioList in preferences saves, so this was kept as-is. The list update is done locally via `setScenarioList` after successful save.
- The `save` function was extracted into a `useCallback` rather than keeping it inline in the setTimeout, for better readability and testability.

## Issues Encountered

None.

## Next Phase Readiness

- All scenario sync operations now report status to the global sync atoms
- The SyncStatusIndicator component (from 14-01) will reflect scenario save state
- Load-failure race condition is eliminated; downstream writes are guarded
- Pattern established for other hooks to follow (withRetry + sync atoms + logging)

---
*Phase: 14-sync-reliability*
*Completed: 2026-02-18*
