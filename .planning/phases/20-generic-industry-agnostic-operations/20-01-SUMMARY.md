---
phase: 20-generic-industry-agnostic-operations
plan: 01
subsystem: database, api
tags: [operations, cost-model, normalization, migration, typescript]

# Dependency graph
requires:
  - phase: 17-generic-product-service-offerings
    provides: normalization pattern (normalizeProductService)
provides:
  - Generic Operations types (WorkforceMember, CapacityConfig, CostItem, CostDriverType, OperationalMetric)
  - normalizeOperations backward-compatible migration function
  - computeOperationsCosts pure cost computation function
affects: [20-02, 20-03, 20-04, financial-projections, scenario-engine, export]

# Tech tracking
tech-stack:
  added: []
  patterns: [cost-driver-model, normalize-at-read-boundary, pure-computation-functions]

key-files:
  created:
    - src/features/sections/operations/normalize.ts
    - src/features/sections/operations/compute.ts
  modified:
    - src/types/plan.ts
    - src/types/index.ts

key-decisions:
  - "CostDriverType uses 7 driver types: per-unit, per-order, per-service-hour, per-machine-hour, monthly, quarterly, yearly"
  - "Workforce monthly cost calculated at 160 hours/month per worker"
  - "Legacy capacity.maxBookings* migrates to maxOutput* with outputUnitLabel='bookings'"

patterns-established:
  - "Cost driver model: every cost item has a type (variable/fixed), a rate, and a driver that determines monthly normalization"
  - "Operations normalization follows same 3-case pattern as normalizeProductService (new format, legacy format, empty/null)"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 20 Plan 01: Data Model v2 + Normalization + Cost Computation Summary

**Generic Operations types replacing event-specific CrewMember/CostBreakdown with WorkforceMember/CostItem cost-driver model, plus backward-compatible migration and pure cost computation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T14:49:47Z
- **Completed:** 2026-02-19T14:53:35Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Replaced event-specific Operations types (CrewMember, CostBreakdown) with generic industry-agnostic model (WorkforceMember, CapacityConfig, CostItem, CostDriverType, OperationalMetric)
- Created normalizeOperations function that migrates legacy event-based Firestore data (crew[], costBreakdown) to the new generic model (workforce[], costItems[])
- Created computeOperationsCosts pure function that derives variableMonthlyTotal, fixedMonthlyTotal, workforceMonthlyTotal, monthlyOperationsTotal, and variableCostPerOutput

## Task Commits

Each task was committed atomically:

1. **Task 1: Define new generic Operations types** - `702b3a0` (feat)
2. **Task 2: Create normalizeOperations and computeOperationsCosts** - `4eb917b` (feat)

## Files Created/Modified
- `src/types/plan.ts` - Replaced CrewMember/CostBreakdown/Operations with WorkforceMember/CapacityConfig/CostItem/CostDriverType/OperationalMetric/Operations
- `src/types/index.ts` - Updated re-exports to match new type names
- `src/features/sections/operations/normalize.ts` - Normalizes raw Firestore data to current Operations format (new, legacy, or empty)
- `src/features/sections/operations/compute.ts` - Pure cost computation: variable/fixed/workforce monthly totals and cost-per-output

## Decisions Made
- Used 7 CostDriverType values (per-unit, per-order, per-service-hour, per-machine-hour, monthly, quarterly, yearly) to cover all business types
- Workforce monthly cost uses 160 hours/month standard (ratePerHour * count * 160)
- Legacy capacity.maxBookings* maps to maxOutput* with outputUnitLabel set to 'bookings'
- Legacy costBreakdown monthly fields each become their own CostItem with descriptive category names

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Generic Operations types ready for UI consumption in 20-02
- normalizeOperations ready to be called at read boundary in operations editor
- computeOperationsCosts ready for live metric display in UI
- Downstream type errors exist in operations/index.tsx, section-prompts.ts, and export files (expected, fixed in Wave 2 plans 20-02 through 20-04)

---
*Phase: 20-generic-industry-agnostic-operations*
*Completed: 2026-02-19*
