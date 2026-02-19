---
phase: 20-generic-industry-agnostic-operations
plan: 03
subsystem: ai
tags: [operations, zod-schema, ai-prompts, industry-overlays, gemini]

# Dependency graph
requires:
  - phase: 20-01
    provides: Generic Operations types (WorkforceMember, CapacityConfig, CostItem, OperationalMetric)
  - phase: 17-04
    provides: Offering-based Zod schema pattern for AI generation
provides:
  - Generic OperationsSchema (Zod) matching new Operations type
  - Updated base prompts for operations generate/improve/expand
  - Updated industry overlays for all 6 business types
affects: [20-04, export, ai-generation]

# Tech tracking
tech-stack:
  added: []
  patterns: [generic-ai-schema-per-section, industry-overlay-for-generic-fields]

key-files:
  created: []
  modified:
    - src/lib/ai/section-prompts.ts

key-decisions:
  - "Single OperationsSchema for all business types — industry differentiation via overlay prompts only"
  - "All overlays structured as: Workforce roles, Capacity units, Variable costs, Fixed costs, Operational metrics"

patterns-established:
  - "Industry overlay pattern: guide AI to fill generic schema fields with industry-appropriate values"

issues-created: []

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 20 Plan 03: AI Schema + Prompts Rewrite Summary

**Generic Zod schemas (WorkforceMember/CapacityConfig/CostItem/OperationalMetric) replacing event-specific CrewMember/CostBreakdown, with updated base prompts and 6 industry overlays**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T14:55:58Z
- **Completed:** 2026-02-19T14:58:18Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Removed CrewMemberSchema and CostBreakdownSchema (24+ hardcoded event-specific fields) from AI generation
- Added WorkforceMemberSchema, CapacityConfigSchema, CostItemSchema, OperationalMetricSchema, and new OperationsSchema matching the generic Operations type exactly
- Updated base generate/improve/expand prompts to reference workforce, capacity, costItems, and operationalMetrics instead of crew, hoursPerEvent, costBreakdown
- Updated all 6 industry overlays (saas, restaurant, retail, service, event, manufacturing) to use generic field guidance

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite Operations Zod schemas** - `a79a664` (feat)
2. **Task 2: Update Operations prompts and industry overlays** - `be8a7ef` (feat)

## Files Created/Modified
- `src/lib/ai/section-prompts.ts` - Replaced old schemas and prompts with generic model

## Decisions Made
- Single OperationsSchema serves all business types; industry differentiation happens purely via overlay prompt text
- All 6 overlays follow consistent structure: Workforce roles, Capacity units, Variable costs, Fixed costs, Operational metrics

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- AI generation now produces data matching new Operations type for all business types
- Ready for 20-04 (Export update + tests) as the final plan in this phase
- No remaining references to CostBreakdown or CrewMember in section-prompts.ts

---
*Phase: 20-generic-industry-agnostic-operations*
*Completed: 2026-02-19*
