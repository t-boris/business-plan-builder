---
phase: 03-what-if-engine
plan: 01
subsystem: ui
tags: [jotai, recharts, firestore, scenario-modeling, real-time]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Jotai store with scenario atoms, derived atoms, Firestore utilities, shadcn/ui components
  - phase: 02-business-plan-sections
    provides: Business plan section UIs with pre-populated data, Recharts integration patterns
provides:
  - Interactive scenario variable controls with real-time derived metric propagation
  - Scenario CRUD (save, load, switch, delete) with Firestore persistence
  - ScenarioManager component for scenario lifecycle management
  - snapshotScenario and loadScenario atoms for serializing/restoring scenario state
affects: [03-02-side-by-side-comparison, 04-ai-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Jotai writable atoms for multi-atom state transitions (loadScenarioAtom, resetToDefaultsAtom)"
    - "snapshotScenarioAtom pattern for serializing distributed atom state into a single object"
    - "Offline-first Firestore pattern with graceful degradation"

key-files:
  created:
    - src/features/scenarios/scenario-controls.tsx
    - src/features/scenarios/scenario-dashboard.tsx
    - src/features/scenarios/scenario-manager.tsx
  modified:
    - src/features/scenarios/index.tsx
    - src/store/scenario-atoms.ts
    - src/lib/firestore.ts

key-decisions:
  - "Explicit atom<number> type annotations to avoid literal type inference from as const defaults"
  - "Ramp-pattern 12-month projection (40%-100% over 4 months) instead of flat-line"
  - "Offline-first Firestore: graceful degradation with amber Offline mode indicator"

patterns-established:
  - "SliderInput component: dual number+range inputs synced to same atom value"
  - "StatCard component: reusable metric display with conditional color coding"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 3 Plan 1: What-If Engine Core Summary

**Interactive scenario controls with Jotai-driven real-time metric propagation, stat dashboard with color-coded cards and 12-month projection chart, and scenario CRUD with Firestore persistence and offline fallback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T16:20:00Z
- **Completed:** 2026-02-11T16:23:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Variable controls panel with 10 inputs (pricing, leads, conversion, CAC, marketing budgets, crew, cost per event) using slider+number pairs
- Derived metrics dashboard with 10 stat cards: monthly bookings, avg check, monthly/annual revenue, monthly/annual profit, costs, profit margin, ad spend, CAC per booking
- 12-month revenue/costs projection AreaChart with ramp pattern
- Scenario CRUD: save to Firestore, load from dropdown, create new (reset to defaults), delete with protection
- Loading a saved scenario sets all primitive atoms via loadScenarioAtom, triggering instant recomputation of all derived metrics

## Task Commits

Each task was committed atomically:

1. **Task 1: Build scenario variable controls with real-time derived metrics dashboard** - `26681b2` (feat)
2. **Task 2: Build scenario CRUD with Firestore persistence** - `6d3e11f` (feat)

## Files Created/Modified
- `src/features/scenarios/scenario-controls.tsx` - Input panel with pricing, leads, marketing, operations controls (slider+number pairs)
- `src/features/scenarios/scenario-dashboard.tsx` - Derived metrics stat cards grid and 12-month projection chart
- `src/features/scenarios/scenario-manager.tsx` - Scenario save/load/switch/delete UI with Firestore integration
- `src/features/scenarios/index.tsx` - Two-column Scenarios page with manager, controls, and dashboard
- `src/store/scenario-atoms.ts` - Added management atoms (currentScenarioId, scenarioList, snapshotScenario, loadScenario, resetToDefaults)
- `src/lib/firestore.ts` - Added deleteScenario function

## Decisions Made
- Used explicit `atom<number>` type annotations because `DEFAULT_SCENARIO_VARIABLES` uses `as const`, causing literal type inference (e.g., `atom(800)` infers `PrimitiveAtom<800>` not `PrimitiveAtom<number>`)
- Ramp-pattern 12-month projection (40% to 100% over 4 months) provides more realistic visualization than flat-line
- Offline-first Firestore approach: catch errors on all Firestore calls and show subtle amber indicator, allowing full in-memory scenario functionality without persistence

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed literal type inference on scenario atoms**
- **Found during:** Task 1 (Scenario controls implementation)
- **Issue:** `atom(DEFAULT_SCENARIO_VARIABLES.priceStarter)` inferred `PrimitiveAtom<800>` due to `as const` on the defaults object, causing `SetAtom<SetStateAction<800>>` incompatibility with `(value: number) => void`
- **Fix:** Added explicit `atom<number>()` type annotations to all primitive scenario atoms
- **Files modified:** src/store/scenario-atoms.ts
- **Verification:** Build passes, all atom setters accept number values
- **Committed in:** 26681b2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type annotation fix required for TypeScript compilation. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Scenario engine core complete with variable controls, real-time propagation, and CRUD
- Ready for 03-02: side-by-side scenario comparison UI

---
*Phase: 03-what-if-engine*
*Completed: 2026-02-11*
