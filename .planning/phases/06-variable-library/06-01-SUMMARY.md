---
phase: 06-variable-library
plan: 01
subsystem: engine
tags: [expr-eval, topological-sort, formula-engine, variable-templates]

# Dependency graph
requires:
  - phase: 01-firestore-data-model
    provides: VariableDefinition and VariableUnit types in business.ts
provides:
  - Formula evaluation engine with dependency resolution (formula-engine.ts)
  - Variable category constants and factory helpers (variable-templates/types.ts)
affects: [06-02-variable-templates, 06-03-variable-picker-ui, 07-generic-scenario-engine]

# Tech tracking
tech-stack:
  added: [expr-eval]
  patterns: [topological-sort-kahn, safe-formula-evaluation, factory-helper-pattern]

key-files:
  created:
    - src/lib/formula-engine.ts
    - src/lib/variable-templates/types.ts
  modified:
    - package.json

key-decisions:
  - "Module-level Parser singleton for expr-eval reuse across calls"
  - "Only store dependsOn in templates; derive dependents when needed"
  - "Graceful degradation: formula errors return 0 with console.warn"

patterns-established:
  - "inputVar/computedVar factories for consistent VariableDefinition creation"
  - "toVariableRecord converts array templates to Record format for BusinessTemplate.defaultVariables"

issues-created: []

# Metrics
duration: 1min
completed: 2026-02-12
---

# Phase 6 Plan 1: Formula Engine & Variable Template Types Summary

**expr-eval formula engine with topological sort dependency resolution, plus variable category constants and factory helpers for template authoring**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-12T01:47:04Z
- **Completed:** 2026-02-12T01:48:19Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Formula evaluation engine with safe expression parsing via expr-eval (no eval())
- Topological sort (Kahn's algorithm) for dependency resolution with cycle detection
- Formula validation utility for UI use when users edit formulas
- Five variable categories (Revenue, Costs, Unit Economics, Growth, Operations) with ordering
- Factory functions (inputVar, computedVar) for consistent variable definition creation
- Array-to-Record conversion helper for template file authoring

## Task Commits

Each task was committed atomically:

1. **Task 1: Install expr-eval and create formula-engine.ts** - `309c455` (feat)
2. **Task 2: Create variable category constants and factory helpers** - `08be30b` (feat)

## Files Created/Modified
- `src/lib/formula-engine.ts` - Formula evaluation engine with getEvaluationOrder, evaluateVariables, validateFormula
- `src/lib/variable-templates/types.ts` - VARIABLE_CATEGORIES constants, VariableCategory type, inputVar/computedVar factories, toVariableRecord helper
- `package.json` - Added expr-eval dependency and @types/expr-eval devDependency
- `package-lock.json` - Updated lockfile

## Decisions Made
- Module-level Parser singleton: reuse single expr-eval Parser instance across all calls for performance
- Only store dependsOn in variable templates: derive dependents when needed, per RESEARCH.md anti-pattern guidance (avoids sync bugs)
- Graceful degradation on formula errors: log warning and return 0 rather than throwing (keeps UI functional)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness
- Formula engine ready for use by variable template files (06-02)
- Factory helpers ready for template authoring
- Ready for 06-02-PLAN.md

---
*Phase: 06-variable-library*
*Completed: 2026-02-12*
