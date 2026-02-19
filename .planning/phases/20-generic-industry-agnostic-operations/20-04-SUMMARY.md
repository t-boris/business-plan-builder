---
phase: 20-generic-industry-agnostic-operations
plan: 04
subsystem: ui, export, testing
tags: [operations, export, pdf, react-pdf, vitest, normalization, cost-computation]

# Dependency graph
requires:
  - phase: 20-01
    provides: normalizeOperations, computeOperationsCosts, Operations types
  - phase: 17-06
    provides: export normalization pattern (normalizeProductService at read boundary)
provides:
  - Generic Operations rendering in web and PDF export (workforce, capacity, costs, metrics)
  - Full test coverage for normalizeOperations and computeOperationsCosts
affects: [financial-projections, scenario-engine]

# Tech tracking
tech-stack:
  added: []
  patterns: [normalize-at-read-boundary-in-exports, cost-summary-stat-cards]

key-files:
  created:
    - src/features/sections/operations/normalize.test.ts
    - src/features/sections/operations/compute.test.ts
  modified:
    - src/features/export/business-plan-view.tsx
    - src/features/export/pdf/BusinessPlanDocument.tsx

key-decisions:
  - "normalizeOperations called at read boundary in both web and PDF exports, same pattern as normalizeProductService"
  - "Cost summary shown as 4 stat cards: Variable/Fixed/Workforce/Total monthly"
  - "Cost items table shows category, type, rate, driver, and monthly total"
  - "Operational metrics rendered as stat cards with target values"

patterns-established:
  - "Operations export pattern: normalize → compute → render sections conditionally (workforce, capacity, costs, metrics, equipment, safety)"

issues-created: []

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 20 Plan 04: Export Update (Web + PDF) + Tests Summary

**Web and PDF exports now render generic Operations structure (workforce, capacity, cost summary, cost items, operational metrics) with 17 new tests covering normalization and cost computation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T14:56:11Z
- **Completed:** 2026-02-19T14:59:51Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Updated web export (business-plan-view.tsx) to use normalizeOperations + computeOperationsCosts with full generic rendering: workforce table, capacity stats, cost summary cards, cost items table, operational metrics, equipment, safety protocols
- Updated PDF export (BusinessPlanDocument.tsx) with identical generic structure using react-pdf components
- Removed all event-specific rendering (crew, maxBookingsPerDay, travelRadius, CostBreakdown)
- Added 10 normalize tests covering null input, new format passthrough, legacy crew/capacity/costBreakdown/customExpenses migration, equipment/safetyProtocols preservation
- Added 7 compute tests covering empty operations, variable sums, fixed cost normalization (quarterly/yearly), workforce monthly total, variableCostPerOutput, combined totals
- Full test suite now at 82 tests, all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Update web and PDF export for new Operations model** - `cb04e93` (feat)
2. **Task 2: Add tests for normalizeOperations and computeOperationsCosts** - `3fd8864` (test)

## Files Created/Modified
- `src/features/export/business-plan-view.tsx` - Web export with generic Operations rendering (normalizeOperations at read boundary, workforce/capacity/costs/metrics sections)
- `src/features/export/pdf/BusinessPlanDocument.tsx` - PDF export with identical generic Operations rendering using react-pdf
- `src/features/sections/operations/normalize.test.ts` - 10 tests for normalizeOperations backward-compatible migration
- `src/features/sections/operations/compute.test.ts` - 7 tests for computeOperationsCosts accuracy

## Decisions Made
- normalizeOperations called at read boundary in both exports, following the same pattern established by normalizeProductService in Phase 17-06
- Cost summary displayed as 4 stat cards (variable/fixed/workforce/total monthly) rather than a table, for visual consistency with other sections
- Operational metrics rendered as stat cards with target values inline, matching the compact export style
- Cost items table includes all 5 columns (category, type, rate, driver, monthly) for full transparency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- All 4 plans in Phase 20 complete
- Generic Operations model fully implemented across types, normalization, computation, UI editor, AI prompts, and exports
- All 82 tests pass, lint clean, build succeeds
- No event-specific or manufacturing-specific terminology remaining in the codebase

---
*Phase: 20-generic-industry-agnostic-operations*
*Completed: 2026-02-19*
