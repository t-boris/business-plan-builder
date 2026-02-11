---
phase: 03-dynamic-business-context
plan: 01
subsystem: database
tags: [firestore, jotai, hooks, business-scoping, migration]

# Dependency graph
requires:
  - phase: 01-firestore-data-model
    provides: Business types, business-firestore.ts service layer
  - phase: 02-business-crud
    provides: activeBusinessIdAtom, business state management
provides:
  - Business-scoped section data functions (getSectionData/saveSectionData)
  - Business-scoped scenario data functions (getScenarioData/saveScenarioData/listScenarioData/deleteScenarioData)
  - Business-scoped preferences functions (getScenarioPreferences/saveScenarioPreferences)
  - useSection hook reading/writing from businesses/{businessId}/sections/{sectionKey}
  - Scenario layer (useScenarioSync, ScenarioSync, ScenarioManager) operating on businesses/{businessId}/scenarios/
affects: [03-02-routing, 04-strip-hardcoded, 07-generic-scenario-engine]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Business-scoped Firestore paths for all data operations"
    - "prevBusinessIdRef pattern for detecting business changes and re-initializing state"
    - "null businessId guard pattern — skip Firestore calls, show defaults"

key-files:
  created: []
  modified:
    - src/lib/business-firestore.ts
    - src/hooks/use-section.ts
    - src/hooks/use-scenario-sync.ts
    - src/app/providers.tsx
    - src/features/scenarios/scenario-manager.tsx

key-decisions:
  - "Raw section data format for Phase 3 (Phase 5 migrates to full BusinessSection wrapper)"
  - "Legacy Scenario type for Phase 3 (Phase 7 migrates to BusinessScenario with VariableDefinition)"
  - "prevBusinessIdRef pattern to detect business switches and reset ScenarioSync loaded state"

patterns-established:
  - "null businessId guard: all hooks/providers skip Firestore operations when no business selected"
  - "Business change reset: clear stale data and reload fresh from Firestore on activeBusinessIdAtom change"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 3 Plan 01: Data Layer Migration Summary

**Migrated all data hooks and providers from hardcoded plan ID to dynamic business-scoped Firestore paths via activeBusinessIdAtom**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T23:37:56Z
- **Completed:** 2026-02-11T23:41:21Z
- **Tasks:** 2
- **Files modified:** 5 (+ 2 deleted)

## Accomplishments
- All section data reads/writes now use `businesses/{businessId}/sections/{sectionKey}` path
- All scenario data reads/writes now use `businesses/{businessId}/scenarios/{scenarioId}` path
- Scenario preferences stored at `businesses/{businessId}/state/preferences`
- ScenarioSync re-initializes when business switches (clears loaded state, resets sync ready flag)
- useSection gracefully handles null businessId (shows defaults, no Firestore calls)
- Old `plan-atoms.ts` and `firestore.ts` deleted — zero legacy imports remain

## Task Commits

Each task was committed atomically:

1. **Task 1: Add section/scenario data functions and migrate useSection** - `958d84b` (feat)
2. **Task 2: Migrate scenario layer to business-scoped Firestore** - `61382d8` (feat)

## Files Created/Modified
- `src/lib/business-firestore.ts` - Added 8 new functions: getSectionData, saveSectionData, getScenarioData, saveScenarioData, listScenarioData, deleteScenarioData, getScenarioPreferences, saveScenarioPreferences
- `src/hooks/use-section.ts` - Migrated from currentPlanIdAtom to activeBusinessIdAtom with null guard and business-change reset
- `src/hooks/use-scenario-sync.ts` - Migrated from planId/saveScenario to businessId/saveScenarioData with null guard
- `src/app/providers.tsx` - ScenarioSync migrated with prevBusinessIdRef pattern for re-initialization on business switch
- `src/features/scenarios/scenario-manager.tsx` - All operations migrated to business-scoped functions with null guards
- `src/store/plan-atoms.ts` - Deleted (unused sectionDataMapAtom/sectionDataAtom)
- `src/lib/firestore.ts` - Deleted (all consumers migrated)

## Decisions Made
- Used raw section data format (not full BusinessSection wrapper) for useSection — Phase 5 will migrate to the full format with schema/order/label
- Used legacy Scenario type (not BusinessScenario) for scenario operations — Phase 7 will migrate to dynamic VariableDefinition variables
- Used prevBusinessIdRef pattern in ScenarioSync to detect business changes and reset loaded state, rather than restructuring the component

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Data layer fully business-aware, ready for 03-02 routing plan
- Switching activeBusinessIdAtom causes all section data and scenario data to reload from correct business-scoped paths
- No blockers or concerns

---
*Phase: 03-dynamic-business-context*
*Completed: 2026-02-11*
