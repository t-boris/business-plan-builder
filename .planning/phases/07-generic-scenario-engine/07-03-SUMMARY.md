---
phase: 07-generic-scenario-engine
plan: 03
subsystem: ui
tags: [jotai, dynamic-controls, scenario-ui, variable-driven, recharts]

# Dependency graph
requires:
  - phase: 07-generic-scenario-engine
    provides: scenarioValuesAtom, evaluatedValuesAtom, businessVariablesAtom
  - phase: 06-variable-library
    provides: VARIABLE_CATEGORIES, VariableDefinition type, formula engine
provides:
  - DynamicScenarioControls (input controls generated from variable definitions)
  - Dynamic ScenarioDashboard (KPI cards from evaluatedValuesAtom)
  - Merged 2-tab layout (Editor + Compare)
affects: [07-04-legacy-cleanup, 10-dashboard-navigation]

# Tech tracking
tech-stack:
  added: []
  patterns: [variable-driven UI rendering from atom definitions]

key-files:
  created: []
  modified:
    - src/features/scenarios/scenario-controls.tsx
    - src/features/scenarios/scenario-dashboard.tsx
    - src/features/scenarios/index.tsx

key-decisions:
  - "Keep export name ScenarioDashboard to minimize downstream import changes"
  - "Flat 12-month chart projection (no ramp factors) since ramp was business-specific"
  - "Semantic coloring based on label pattern matching (profit, margin, cost, revenue)"

patterns-established:
  - "Dynamic UI from atom-backed variable definitions: read definitions -> group -> render controls"

issues-created: []

# Metrics
duration: 2min
completed: 2026-02-12
---

# Phase 7 Plan 03: Dynamic Scenario UI Summary

**Variable-driven scenario controls and dashboard replacing hardcoded components, with merged Editor/Compare tab layout**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-12T02:25:28Z
- **Completed:** 2026-02-12T02:27:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced hardcoded ScenarioControls with DynamicScenarioControls that generates inputs from businessVariablesAtom definitions grouped by category
- Replaced hardcoded ScenarioDashboard with dynamic KPI cards from evaluatedValuesAtom computed variables
- Merged 3-tab layout (Editor, Variables, Compare) into 2-tab layout (Editor, Compare) since controls now ARE the variables
- Chart uses evaluated monthly_revenue/monthly_costs values with flat 12-month projection

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite ScenarioControls as DynamicScenarioControls and merge tabs** - `b5e250d` (feat)
2. **Task 2: Rewrite ScenarioDashboard as DynamicScenarioDashboard** - `37acd31` (feat)

## Files Created/Modified
- `src/features/scenarios/scenario-controls.tsx` - DynamicScenarioControls with category-grouped input controls from businessVariablesAtom
- `src/features/scenarios/scenario-dashboard.tsx` - Dynamic KPI StatCards from evaluatedValuesAtom computed variables + data-driven chart
- `src/features/scenarios/index.tsx` - Removed Variables tab, replaced ScenarioControls with DynamicScenarioControls

## Decisions Made
- Kept export name `ScenarioDashboard` (not `DynamicScenarioDashboard`) to avoid extra import changes in index.tsx
- Used flat 12-month chart projection instead of ramp factors (ramp was Fun Box-specific)
- Applied semantic coloring by label pattern matching: profit/margin/cost/revenue keywords drive color assignment
- Used VARIABLE_CATEGORIES from types.ts for category ordering with fallback for unknown categories

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- All scenario UI components now driven by dynamic variable definitions
- Ready for 07-04 (comparison view rewrite, main dashboard migration, and legacy atom cleanup)
- variable-editor.tsx preserved for advanced variable management (add/remove/edit formulas)

---
*Phase: 07-generic-scenario-engine*
*Completed: 2026-02-12*
