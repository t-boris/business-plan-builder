---
phase: 07-generic-scenario-engine
plan: 04
subsystem: state
tags: [jotai, dynamic-scenario, cleanup, evaluateVariables, formula-engine, legacy-removal]

# Dependency graph
requires:
  - phase: 07-generic-scenario-engine
    provides: scenarioValuesAtom, evaluatedValuesAtom, businessVariablesAtom, DynamicScenario type
  - phase: 06-variable-library
    provides: VariableDefinition type, evaluateVariables, formula engine
provides:
  - Fully dynamic ScenarioComparison (evaluates any variable set for side-by-side comparison)
  - Dynamic Dashboard KPIs from evaluatedValuesAtom
  - Complete removal of all legacy hardcoded scenario code
affects: [08-business-aware-ai, 10-dashboard-navigation, 11-export-updates]

# Tech tracking
tech-stack:
  added: []
  patterns: [evaluateVariables for ad-hoc scenario evaluation in comparison view]

key-files:
  created: []
  modified:
    - src/features/scenarios/scenario-comparison.tsx
    - src/features/dashboard/index.tsx
    - src/store/scenario-atoms.ts
    - src/store/derived-atoms.ts
    - src/lib/constants.ts
    - src/types/scenario.ts
    - src/types/index.ts
    - src/features/export/business-plan-view.tsx
    - src/features/export/index.tsx
    - src/hooks/use-ai-suggestion.ts
    - src/lib/ai/context-builder.ts
    - src/hooks/use-businesses.ts

key-decisions:
  - "ScenarioComparison evaluates each scenario independently using evaluateVariables with merged definitions"
  - "Dashboard renders first 4 computed variables as primary KPIs, next 4 as secondary"
  - "Export views and AI hooks migrated to evaluatedValuesAtom as part of cleanup"
  - "context-builder.ts accepts Record<string, number> instead of ComputedMetrics for generic scenario context"

patterns-established:
  - "Ad-hoc scenario evaluation: merge scenario.values into definitions, call evaluateVariables"

issues-created: []

# Metrics
duration: 6min
completed: 2026-02-12
---

# Phase 7 Plan 04: Comparison, Dashboard, and Legacy Cleanup Summary

**ScenarioComparison and Dashboard rewritten for dynamic variables, all 10 primitive + 10 derived legacy atoms removed along with hardcoded types and constants**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-12T02:32:19Z
- **Completed:** 2026-02-12T02:38:13Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Rewrote ScenarioComparison to evaluate any variable set using evaluateVariables for side-by-side comparison
- Rewrote Dashboard to render KPI cards and charts from evaluatedValuesAtom computed variables
- Removed all 10 primitive atoms (priceTier1Atom through costPerUnitAtom)
- Removed all 10 derived atoms (monthlyBookingsAtom through profitMarginAtom)
- Removed computeDerivedMetrics, ComputedMetrics, snapshotScenarioAtom, loadScenarioAtom, resetToDefaultsAtom
- Removed DEFAULT_SCENARIO_VARIABLES, MONTHLY_FIXED_COSTS, ScenarioVariables, Scenario, DerivedMetrics types
- Migrated export views and AI suggestion hook to use evaluatedValuesAtom
- Migrated context-builder to accept generic Record<string, number> metrics

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite ScenarioComparison and update Dashboard** - `43005fd` (feat)
2. **Task 2: Remove legacy hardcoded atoms, types, and constants** - `5649281` (feat)

## Files Created/Modified
- `src/features/scenarios/scenario-comparison.tsx` - Fully rewritten to use evaluateVariables with DynamicScenario and businessVariablesAtom
- `src/features/dashboard/index.tsx` - Rewritten to use evaluatedValuesAtom for dynamic KPIs and chart
- `src/store/scenario-atoms.ts` - Removed 10 primitive atoms, snapshotScenarioAtom, loadScenarioAtom, resetToDefaultsAtom
- `src/store/derived-atoms.ts` - Removed computeDerivedMetrics, ComputedMetrics, and all 10 old derived atoms
- `src/lib/constants.ts` - Removed DEFAULT_SCENARIO_VARIABLES and MONTHLY_FIXED_COSTS
- `src/types/scenario.ts` - Removed ScenarioVariables, Scenario, DerivedMetrics interfaces
- `src/types/index.ts` - Updated exports to remove legacy types
- `src/features/export/business-plan-view.tsx` - Migrated from individual derived atoms to evaluatedValuesAtom
- `src/features/export/index.tsx` - Migrated from individual derived atoms to evaluatedValuesAtom
- `src/hooks/use-ai-suggestion.ts` - Migrated from snapshotScenarioAtom + computeDerivedMetrics to evaluatedValuesAtom
- `src/lib/ai/context-builder.ts` - Changed ComputedMetrics to Record<string, number>
- `src/hooks/use-businesses.ts` - Removed unused setActiveBusinessId (pre-existing issue)

## Decisions Made
- ScenarioComparison evaluates each scenario independently using evaluateVariables with merged definitions (same pattern as evaluatedValuesAtom)
- Dashboard renders first 4 computed variables as primary KPIs, next 4 as secondary
- Export views and AI hooks migrated to evaluatedValuesAtom as part of cleanup (not deferred to Phase 11)
- context-builder.ts accepts generic Record<string, number> instead of ComputedMetrics interface

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migrated export views and AI hooks from old atoms**
- **Found during:** Task 2 (legacy removal)
- **Issue:** business-plan-view.tsx, export/index.tsx, use-ai-suggestion.ts, and context-builder.ts still imported old atoms/types that were being removed
- **Fix:** Migrated to evaluatedValuesAtom and Record<string, number> pattern
- **Files modified:** src/features/export/business-plan-view.tsx, src/features/export/index.tsx, src/hooks/use-ai-suggestion.ts, src/lib/ai/context-builder.ts
- **Verification:** npx tsc --noEmit passes, npm run build succeeds
- **Committed in:** 5649281 (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed unused setActiveBusinessId in use-businesses.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** Pre-existing unused variable causing tsc -b build failure
- **Fix:** Removed unused declaration and import
- **Files modified:** src/hooks/use-businesses.ts
- **Verification:** npm run build succeeds
- **Committed in:** 5649281 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary to complete legacy removal and pass build. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Phase 7 complete: entire scenario engine is now dynamic and variable-driven
- No hardcoded scenario code remains anywhere in the codebase
- All atoms, types, constants, and consumers migrated to dynamic evaluation
- Ready for Phase 8 (Business-Aware AI) which will use the generic metric context

---
*Phase: 07-generic-scenario-engine*
*Completed: 2026-02-12*
