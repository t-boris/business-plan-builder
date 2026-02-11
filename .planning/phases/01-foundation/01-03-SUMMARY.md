---
phase: 01-foundation
plan: 03
subsystem: database, state
tags: [typescript, firestore, jotai, atoms, types, state-management]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: Vite + React + TypeScript project scaffold with Firebase and Jotai installed
provides:
  - TypeScript type system for all 9 business plan sections
  - Scenario variable and derived metric types
  - Firestore subcollection read/write/subscribe utilities
  - Jotai primitive atoms for scenario inputs
  - Jotai derived atoms for computed business metrics (revenue, costs, profit, margin)
  - Pre-populated business constants (packages, KPI targets, marketing channels)
  - Section slug and label mappings
affects: [02-business-plan-sections, 03-what-if-engine, 04-ai-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [Firestore subcollection model (plans/{id}/sections/{slug}), Jotai primitive + derived atom pattern, atom factory for section data, barrel re-exports for types]

key-files:
  created: [src/types/plan.ts, src/types/scenario.ts, src/types/index.ts, src/lib/constants.ts, src/lib/firestore.ts, src/store/scenario-atoms.ts, src/store/derived-atoms.ts, src/store/plan-atoms.ts]
  modified: []

key-decisions:
  - "Firestore subcollection paths: plans/{planId}/sections/{sectionSlug} and plans/{planId}/scenarios/{scenarioId}"
  - "Equal distribution assumed for avgCheck calculation across 3 packages"
  - "Crew hourly rate $20 and 4 hours per event as operational constants"

patterns-established:
  - "Type-first: all data structures defined as serializable interfaces before implementation"
  - "Derived atoms: computed values use atom((get) => ...) with no useEffect"
  - "Atom factory: sectionDataAtom(slug) returns a read-only atom for any section"
  - "Firestore utilities: simple read/write/subscribe functions, full sync wiring deferred to Phase 2"

issues-created: []

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 1 Plan 3: Data Layer Summary

**TypeScript type system for 9 business plan sections, Firestore subcollection utilities, and Jotai atoms with derived calculation chain for scenario modeling**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-11T15:49:47Z
- **Completed:** 2026-02-11T15:53:55Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Complete TypeScript type system covering all 9 business plan sections with serializable interfaces
- Scenario variable and derived metric types ready for the what-if engine
- Firestore subcollection utilities (getSection, saveSection, subscribeToSection, getScenario, saveScenario, listScenarios)
- Jotai primitive atoms for all adjustable scenario inputs initialized with business defaults
- Jotai derived atoms computing the full financial chain: bookings, avgCheck, revenue, adSpend, CAC, costs, profit, margin
- Constants pre-populated with Fun Box business data (3 packages, KPI targets, 4 marketing channels, section labels)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TypeScript types for business plan sections and scenarios** - `8e1738b` (feat)
2. **Task 2: Create Firestore utilities, constants, and Jotai atoms** - `1632517` (feat)

## Files Created/Modified
- `src/types/plan.ts` - Interfaces for all 9 sections, BusinessPlan metadata, SectionSlug union type
- `src/types/scenario.ts` - ScenarioVariables, ScenarioMetadata, Scenario, DerivedMetrics interfaces
- `src/types/index.ts` - Barrel file re-exporting all types
- `src/lib/constants.ts` - DEFAULT_PACKAGES, DEFAULT_KPI_TARGETS, DEFAULT_MARKETING_CHANNELS, SECTION_SLUGS, SECTION_LABELS, DEFAULT_SCENARIO_VARIABLES, operational constants
- `src/lib/firestore.ts` - Firestore subcollection CRUD utilities for sections and scenarios
- `src/store/scenario-atoms.ts` - Primitive Jotai atoms for scenario inputs (pricing, leads, conversion, budgets, crew, costs)
- `src/store/derived-atoms.ts` - Derived Jotai atoms for computed metrics (bookings, avgCheck, revenue, adSpend, CAC, costs, profit, annualRevenue, annualProfit, profitMargin)
- `src/store/plan-atoms.ts` - currentPlanIdAtom, sectionDataMapAtom, sectionDataAtom factory

## Decisions Made
- Firestore subcollection paths follow `plans/{planId}/sections/{sectionSlug}` and `plans/{planId}/scenarios/{scenarioId}` pattern
- Average check calculated as equal distribution across 3 packages (can be adjusted when booking mix data is available)
- Operational constants: crew hourly rate $20 (average across roles), 4 hours per event, derived from PROJECT.md labor cost data
- Firestore utilities kept simple (read/write/subscribe) with full auto-save sync deferred to Phase 2

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Type system ready for all section UIs in Phase 2
- Firestore utilities ready for data persistence
- Jotai atoms ready for what-if scenario engine in Phase 3
- Constants provide pre-populated defaults for section forms
- Ready for remaining Phase 1 work (01-02: dashboard layout and routing)

---
*Phase: 01-foundation*
*Completed: 2026-02-11*
