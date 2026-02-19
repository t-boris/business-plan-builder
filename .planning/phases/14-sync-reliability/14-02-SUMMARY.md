---
phase: 14-sync-reliability
plan: 02
subsystem: section-sync
tags: [sync, useSection, retry, logging, jotai]

requires:
  - phase: 14-sync-reliability
    plan: 01
    provides: Sync status types, Jotai atoms, retry utility, structured logger
provides:
  - saveSectionData now writes updatedAt timestamp on every save
  - useSection returns isSaving, saveError, lastSaved for UI consumption
  - useSection reports sync state to global Jotai atoms via updateSyncAtom
  - Failed section saves are retried with exponential backoff via withRetry
  - All section operations logged with structured logger (section domain)
affects:
  - src/lib/business-firestore.ts
  - src/hooks/use-section.ts

tech-stack:
  added: []
  patterns:
    - "saveSectionData injects updatedAt matching updateBusiness pattern"
    - "useSection wraps saves with withRetry for exponential backoff"
    - "useSection reports sync state via updateSyncAtom writer atom"
    - "Structured logging replaces all silent catch blocks"

key-files:
  created: []
  modified:
    - src/lib/business-firestore.ts
    - src/hooks/use-section.ts

key-decisions:
  - "updatedAt injected at saveSectionData level (service layer) not hook level"
  - "useSetAtom(updateSyncAtom) used for atom updates in hook"
  - "Unmount flush uses .catch() instead of try/catch since it is fire-and-forget"
  - "Load failures logged as warn (expected when emulator unavailable)"
  - "Save failures logged as error (unexpected in production)"

patterns-established:
  - "Save hooks report sync state: saving before, saved/error after"
  - "withRetry wraps all Firestore write operations in save hooks"
  - "Unmount flush is best-effort with .catch(log.warn)"

issues-created: []

duration: 5min
completed: 2026-02-18
---

# Phase 14 Plan 02: useSection Sync Status, Retry, and Logging

**Added updatedAt timestamp to saveSectionData and refactored useSection hook with sync status reporting (isSaving/saveError/lastSaved), retry with exponential backoff via withRetry, and structured logging via createLogger. All silent catch blocks replaced with proper logging. Save state reported to global Jotai sync atoms for the SyncStatusIndicator.**

## Performance

- **Duration:** 5 min
- **Tasks:** 2
- **Files created:** 0
- **Files modified:** 2

## Accomplishments

- Modified `saveSectionData` to inject `updatedAt: new Date().toISOString()` into data before saving, matching the pattern used by `updateBusiness` and `saveBusinessSection`
- Added `isSaving`, `saveError`, `lastSaved` to `UseSectionReturn` interface
- Added three new state variables (`useState`) for tracking save status
- Imported `createLogger`, `withRetry`, and `updateSyncAtom` into `useSection`
- Created `const log = createLogger('section')` for structured logging
- Wrapped `saveSectionData` call in `debounceSave` with `withRetry()` for exponential backoff (3 retries, 1s base delay)
- Added sync atom reporting: sets 'saving' before save, 'saved' with timestamp on success, 'error' with message on failure
- Replaced silent load `catch {}` with `log.warn('load.failed', ...)` including businessId, section, and error details
- Replaced silent save `catch {}` with full sync state reporting and `log.error('save.failed', ...)`
- Fixed unmount flush: replaced `try { saveSectionData(...) } catch {}` with `saveSectionData(...).catch(err => log.warn('flush.failed', ...))`
- Added `setSync` to `debounceSave` dependency array for correctness
- Verified `npx vite build` succeeds with zero errors

## Task Commits

1. **Task 1: Add updatedAt to saveSectionData** - `263e98d`
2. **Task 2: Refactor useSection with sync status, retry, and logging** - `c63dd1e`

## Files Created/Modified

- `src/lib/business-firestore.ts` - saveSectionData now injects updatedAt timestamp (1 line changed)
- `src/hooks/use-section.ts` - Expanded with sync status, retry, logging (45 lines added, 14 removed)

## Decisions Made

- `updatedAt` injected at the service layer (`saveSectionData`) rather than in the hook, so all callers benefit
- Used `useSetAtom(updateSyncAtom)` rather than `useAtom` since we only need the setter
- Unmount flush uses promise `.catch()` instead of try/catch since `saveSectionData` is async and fire-and-forget in cleanup
- Load errors logged as `warn` level (expected when Firestore emulator unavailable during dev)
- Save errors logged as `error` level (unexpected in production, indicates real failure)

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- useSection now fully reports sync state -- SyncStatusIndicator will show section save status
- The same pattern (withRetry + updateSyncAtom + logging) is ready to apply to useScenarioSync and other save hooks
- `isSaving`, `saveError`, `lastSaved` are available for section editors to show inline save indicators if desired

---
*Phase: 14-sync-reliability*
*Completed: 2026-02-18*
