---
phase: 03-what-if-engine
plan: 02
subsystem: ui
tags: [recharts, jotai, firestore, scenario-comparison, dashboard, tabs]

# Dependency graph
requires:
  - phase: 03-what-if-engine
    provides: Scenario CRUD with Firestore persistence, scenario variable atoms, derived metric atoms, ScenarioManager/Controls/Dashboard components
  - phase: 01-foundation
    provides: Jotai store, shadcn/ui components (Tabs, Select, Card), Recharts, routing
provides:
  - Side-by-side scenario comparison UI with visual diffs and grouped bar chart
  - computeDerivedMetrics() pure function for atom-free metric calculation
  - Live dashboard overview with KPI cards from active scenario atoms
  - Section navigation grid with icons and descriptions
affects: [04-ai-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "computeDerivedMetrics() pure function: mirrors Jotai derived atom calculations without atom dependencies for read-only comparison"
    - "Tabs-based page layout: Editor/Compare tabs on Scenarios page"
    - "KPI card pattern: reusable stat display with conditional color coding and size variants"

key-files:
  created:
    - src/features/scenarios/scenario-comparison.tsx
  modified:
    - src/features/scenarios/index.tsx
    - src/features/dashboard/index.tsx
    - src/store/derived-atoms.ts

key-decisions:
  - "ComputedMetrics interface separate from DerivedMetrics: includes profitMargin and totalMonthlyAdSpend needed for comparison but not in original DerivedMetrics type"
  - "Flat-line 12-month projection on dashboard (vs ramp on scenario dashboard): dashboard shows steady-state projection, scenario editor shows growth ramp"
  - "Winner badge uses blue/emerald coloring matching scenario A/B header colors for visual consistency"

patterns-established:
  - "computeDerivedMetrics() pure function: reusable pattern for computing metrics from ScenarioVariables without Jotai dependency"
  - "Section navigation grid: 9 cards with icons, titles, descriptions linking to business plan sections"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 3 Plan 2: Scenario Comparison & Dashboard Summary

**Side-by-side scenario comparison with visual diff tables and grouped bar chart, plus live dashboard overview with KPI cards, revenue projection, and section navigation from active scenario atoms**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T16:25:49Z
- **Completed:** 2026-02-11T16:28:58Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Side-by-side comparison: dual Select dropdowns to pick two saved scenarios, input variables diff table, derived metrics comparison table with winner badges and >10% significance highlighting, grouped BarChart (Revenue, Costs, Profit, Ad Spend)
- Pure `computeDerivedMetrics()` function mirrors all Jotai derived atom calculations without atom dependencies, enabling read-only comparison without modifying active scenario state
- Live dashboard overview with 4 primary KPI cards (Monthly Revenue, Profit, Bookings, Margin) and 4 secondary cards (Annual Revenue/Profit, Ad Spend, CAC), all reading from Jotai derived atoms
- Active scenario name badge on dashboard linking to /scenarios, 12-month flat revenue projection chart, 9-card section navigation grid

## Task Commits

Each task was committed atomically:

1. **Task 1: Build side-by-side scenario comparison UI** - `ca0e91e` (feat)
2. **Task 2: Enhance dashboard overview with live scenario metrics** - `9db7ff7` (feat)

## Files Created/Modified
- `src/features/scenarios/scenario-comparison.tsx` - Comparison view with scenario selectors, variable diff table, metric comparison table with winners, and grouped BarChart
- `src/features/scenarios/index.tsx` - Added Tabs component wrapping Editor (existing) and Compare (new comparison) views
- `src/store/derived-atoms.ts` - Added computeDerivedMetrics() pure function and ComputedMetrics interface
- `src/features/dashboard/index.tsx` - Replaced placeholder with live KPI dashboard reading Jotai atoms, revenue chart, section nav grid

## Decisions Made
- Created separate `ComputedMetrics` interface rather than reusing `DerivedMetrics` type, because comparison needs `profitMargin` and `totalMonthlyAdSpend` which were not in the original `DerivedMetrics` interface
- Dashboard uses flat-line 12-month projection (steady state) while scenario editor dashboard keeps ramp pattern (growth trajectory) for differentiation
- Winner badges use blue (A) / emerald (B) to match the column header colors in comparison table

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused scenarioListAtom import in comparison component**
- **Found during:** Task 1 (Scenario comparison build)
- **Issue:** Initially imported `scenarioListAtom` from atoms for scenario list, but comparison loads scenarios directly from Firestore via `listScenarios()` for fresh data — the atom import was unused
- **Fix:** Removed unused `useAtomValue` and `scenarioListAtom` imports
- **Files modified:** src/features/scenarios/scenario-comparison.tsx
- **Verification:** Build passes with no TS6133 unused variable errors
- **Committed in:** ca0e91e (Task 1 commit)

**2. [Rule 3 - Blocking] Removed unused monthlyCostsAtom import in dashboard**
- **Found during:** Task 2 (Dashboard enhancement)
- **Issue:** Imported `monthlyCostsAtom` but dashboard layout only shows revenue/profit/bookings/margin — costs not displayed as standalone KPI
- **Fix:** Removed unused import
- **Files modified:** src/features/dashboard/index.tsx
- **Verification:** Build passes
- **Committed in:** 9db7ff7 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking — unused imports)
**Impact on plan:** Trivial cleanup of unused imports. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Phase 3 (What-If Engine) fully complete: scenario controls, real-time derived metrics, CRUD, comparison, live dashboard
- Ready for Phase 4: AI + Export (Gemini 2.5 Pro integration, business plan view, PDF export)

---
*Phase: 03-what-if-engine*
*Completed: 2026-02-11*
