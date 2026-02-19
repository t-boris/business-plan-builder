---
phase: 18-advanced-scenario-engine
plan: 01
subsystem: scenario
tags: [firestore, typescript, normalization, backward-compat]

# Dependency graph
requires:
  - phase: 17-generic-product-service-offerings
    provides: normalizeProductService pattern for backward-compatible normalization
  - phase: 07-generic-scenario-engine
    provides: DynamicScenario type, scenario persistence functions
provides:
  - DynamicScenario v2 type with assumptions, variantRefs, sectionOverrides, status, horizonMonths
  - normalizeScenario function for backward-compatible data loading
  - SectionVariant CRUD functions for per-section variant storage
affects: [18-02, 18-03, 18-04, 18-05, 18-06, 18-07, 18-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "normalizeScenario pattern: raw Firestore data -> typed DynamicScenario with v2 defaults"
    - "SectionVariant subcollection: businesses/{id}/sections/{slug}/variants/{variantId}"

key-files:
  created: []
  modified:
    - src/types/scenario.ts
    - src/types/index.ts
    - src/lib/business-firestore.ts

key-decisions:
  - "All v2 fields optional for backward compatibility — old scenarios load without migration"
  - "normalizeScenario applied at read boundary (getScenarioData, listScenarioData) not write boundary"
  - "SectionVariant stored as subcollection of section document, not top-level collection"

patterns-established:
  - "normalizeScenario: same pattern as normalizeProductService — raw data in, typed defaults out"
  - "withRetry on write operations for scenario save and variant CRUD"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 18 Plan 01: Data Model v2 + Backward Compatibility Summary

**DynamicScenario extended with v2 fields (assumptions, variantRefs, sectionOverrides, status, horizonMonths), normalizeScenario for backward-compatible loading, and SectionVariant CRUD for per-section variant storage**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T04:39:07Z
- **Completed:** 2026-02-19T04:41:55Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extended DynamicScenario with v2 fields (all optional for backward compatibility)
- Created normalizeScenario function handling null/old/new data formats with sensible defaults
- Updated Firestore get/list/save scenario functions to normalize and retry
- Implemented SectionVariant interface and full CRUD (save, get, list, delete) with error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend DynamicScenario types with v2 fields** - `9564314` (feat)
2. **Task 2: Update Firestore persistence for v2 scenario fields** - `6d5149f` (feat)

## Files Created/Modified
- `src/types/scenario.ts` - Added ScenarioAssumption, ScenarioStatus, v2 DynamicScenario fields, normalizeScenario function
- `src/types/index.ts` - Exported new types and normalizeScenario from barrel
- `src/lib/business-firestore.ts` - Updated scenario persistence with normalizeScenario, added SectionVariant CRUD

## Decisions Made
- All v2 fields are optional on DynamicScenario for backward compatibility — old scenarios omit them and normalizeScenario fills defaults
- normalizeScenario applied at the read boundary (getScenarioData, listScenarioData) so old data is normalized on load
- SectionVariant stored as a subcollection under sections (businesses/{id}/sections/{slug}/variants/{variantId}) rather than a top-level collection
- withRetry from @/lib/retry used for write operations (not @/lib/sync-status as plan mentioned — the codebase uses retry.ts)
- createLogger('business-firestore') added for structured error logging on variant operations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Foundation types and persistence are ready for 18-02 (effective scenario engine / composition layer)
- normalizeScenario ensures all scenario data has v2 defaults
- SectionVariant CRUD supports the variant creation/selection needed in 18-03 and 18-04

---
*Phase: 18-advanced-scenario-engine*
*Completed: 2026-02-19*
