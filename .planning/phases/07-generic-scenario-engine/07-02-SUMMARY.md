---
phase: 07-generic-scenario-engine
plan: 02
subsystem: state
tags: [firestore, jotai, scenario-sync, dynamic-scenario, persistence]

# Dependency graph
requires:
  - phase: 07-generic-scenario-engine
    provides: scenarioValuesAtom, snapshotInputValuesAtom, loadDynamicScenarioAtom, resetDynamicToDefaultsAtom, DynamicScenario type
  - phase: 06-variable-library
    provides: businessVariablesAtom, businessVariablesLoadedAtom, VariableDefinition type
provides:
  - DynamicScenario persistence pipeline (save/load/list as Record<string, number>)
  - ScenarioSync creates baseline from variable definitions
  - ScenarioManager uses dynamic load/reset atoms
affects: [07-03-scenario-ui, 07-04-legacy-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns: [DynamicScenario Firestore persistence with Record<string, number> values]

key-files:
  created: []
  modified: [src/lib/business-firestore.ts, src/hooks/use-scenario-sync.ts, src/app/providers.tsx, src/features/scenarios/scenario-manager.tsx]

key-decisions:
  - "ScenarioSync gates init on variablesLoaded to ensure definitions available for baseline creation"
  - "Baseline default values built by iterating input-type variable definitions"

patterns-established:
  - "DynamicScenario as the Firestore persistence format for scenarios"

issues-created: []

# Metrics
duration: 2min
completed: 2026-02-12
---

# Phase 7 Plan 02: Scenario Persistence Migration Summary

**Firestore scenario functions, sync hook, provider, and manager migrated from hardcoded Scenario type to DynamicScenario with Record<string, number> values**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-12T02:25:21Z
- **Completed:** 2026-02-12T02:27:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Migrated all Firestore scenario functions (save/get/list) to accept and return DynamicScenario
- Rewrote useScenarioSync to save snapshotInputValuesAtom (Record<string, number>) instead of snapshotScenarioAtom (ScenarioVariables)
- ScenarioSync provider now creates baseline scenarios from businessVariablesAtom definitions instead of DEFAULT_SCENARIO_VARIABLES
- ScenarioManager uses loadDynamicScenarioAtom and resetDynamicToDefaultsAtom

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Firestore scenario functions and rewrite useScenarioSync** - `d0356c3` (feat)
2. **Task 2: Rewrite ScenarioSync provider and ScenarioManager** - `450ffb4` (feat)

## Files Created/Modified
- `src/lib/business-firestore.ts` - saveScenarioData/getScenarioData/listScenarioData now use DynamicScenario type
- `src/hooks/use-scenario-sync.ts` - Reads snapshotInputValuesAtom, builds DynamicScenario for saves
- `src/app/providers.tsx` - ScenarioSync creates baseline from variable definitions, gates on variablesLoaded
- `src/features/scenarios/scenario-manager.tsx` - Uses loadDynamicScenarioAtom and resetDynamicToDefaultsAtom

## Decisions Made
- ScenarioSync gates init on variablesLoaded to ensure variable definitions are available when creating baseline defaults
- Baseline default values built by iterating input-type variable definitions from businessVariablesAtom

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Scenario persistence pipeline fully migrated to DynamicScenario
- Ready for 07-03 (scenario UI migration)
- Old hardcoded atoms still exist for consumers not yet migrated (cleanup in 07-04)

---
*Phase: 07-generic-scenario-engine*
*Completed: 2026-02-12*
