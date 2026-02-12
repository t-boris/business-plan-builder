---
phase: 07-generic-scenario-engine
plan: 01
subsystem: state
tags: [jotai, atoms, scenario-engine, formula-engine, dynamic-atoms]

# Dependency graph
requires:
  - phase: 06-variable-library
    provides: businessVariablesAtom, VariableDefinition type, evaluateVariables function
provides:
  - scenarioValuesAtom (dynamic scenario input values)
  - evaluatedValuesAtom (formula-evaluated variable values)
  - snapshotInputValuesAtom (filtered input-only values)
  - loadDynamicScenarioAtom (load DynamicScenario into atoms)
  - resetDynamicToDefaultsAtom (reset to variable defaults)
  - DynamicScenario type
affects: [07-02-scenario-persistence, 07-03-scenario-ui, 07-04-legacy-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns: [dynamic Record-based atom architecture alongside hardcoded atoms]

key-files:
  created: []
  modified: [src/store/scenario-atoms.ts, src/store/derived-atoms.ts, src/types/scenario.ts, src/types/index.ts]

key-decisions:
  - "Purely additive: all new atoms coexist with old hardcoded atoms until 07-04 cleanup"
  - "evaluatedValuesAtom catches circular dependency errors and falls back to raw values"

patterns-established:
  - "Dynamic Record<string, number> atoms for variable-driven state management"

issues-created: []

# Metrics
duration: 2min
completed: 2026-02-12
---

# Phase 7 Plan 01: Dynamic Atom Architecture Summary

**Record-based scenarioValuesAtom + formula-engine-powered evaluatedValuesAtom added alongside existing hardcoded atoms**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-12T02:21:32Z
- **Completed:** 2026-02-12T02:23:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added 5 new dynamic atoms (scenarioValuesAtom, snapshotInputValuesAtom, loadDynamicScenarioAtom, resetDynamicToDefaultsAtom, evaluatedValuesAtom) for generic scenario engine
- Added DynamicScenario type with metadata and Record<string, number> values
- All existing hardcoded atoms and types remain intact for backward compatibility

## Task Commits

Each task was committed atomically:

1. **Task 2: Add DynamicScenario type and export** - `619aacd` (feat)
2. **Task 1: Add dynamic atoms to scenario-atoms.ts and derived-atoms.ts** - `b534fb5` (feat)

## Files Created/Modified
- `src/types/scenario.ts` - Added DynamicScenario interface
- `src/types/index.ts` - Added DynamicScenario to export list
- `src/store/scenario-atoms.ts` - Added scenarioValuesAtom, snapshotInputValuesAtom, loadDynamicScenarioAtom, resetDynamicToDefaultsAtom
- `src/store/derived-atoms.ts` - Added evaluatedValuesAtom with formula engine evaluation and error fallback

## Decisions Made
- Purely additive: all new atoms coexist with old hardcoded atoms until 07-04 cleanup
- evaluatedValuesAtom catches circular dependency errors and falls back to raw .value from merged definitions
- Task 2 (types) executed before Task 1 (atoms) to satisfy import dependency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Dynamic atom layer ready for 07-02 (scenario persistence migration)
- All 5 atoms importable and TypeScript compiles cleanly
- No breaking changes to existing code

---
*Phase: 07-generic-scenario-engine*
*Completed: 2026-02-12*
