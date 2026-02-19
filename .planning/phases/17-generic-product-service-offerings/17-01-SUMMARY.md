---
phase: 17-generic-product-service-offerings
plan: 01
subsystem: types
tags: [typescript, offering, normalization, vitest, backward-compat]

# Dependency graph
requires:
  - phase: 12-integration-and-polish
    provides: existing Package/AddOn/ProductService types and product-service UI
provides:
  - Offering, OfferingImage, AddOn v2, ProductService v2 interfaces
  - normalizeProductService function for legacy-to-new format conversion
affects: [17-02, 17-03, 17-04, 17-05, 17-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Normalization pattern: read-path converts legacy Firestore data to new format"
    - "ID generation fallback: crypto.randomUUID with Math.random fallback for test envs"

key-files:
  created:
    - src/features/sections/product-service/normalize.ts
    - src/features/sections/product-service/normalize.test.ts
  modified:
    - src/types/plan.ts
    - src/types/index.ts

key-decisions:
  - "Old Package type fully removed (not aliased) — legacy format handled by LegacyPackage in normalize.ts"
  - "Offering.price is number|null (null = on request) with optional priceLabel for unit"
  - "Legacy Package.includes folded into Offering.description as bullet points"
  - "Legacy Package.duration maps to Offering.priceLabel"

patterns-established:
  - "Normalization at read boundary: normalizeProductService converts any stored format to current types"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 17 Plan 01: Domain Model & Normalization Summary

**New Offering/AddOn/ProductService types replace legacy Package model with normalizeProductService backward-compat converter (6 tests)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T03:48:03Z
- **Completed:** 2026-02-19T03:50:56Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Replaced Package interface with Offering (id, name, description, price|null, priceLabel, addOnIds, image)
- Added OfferingImage interface for future image upload support
- Enhanced AddOn with id, optional description, and priceLabel fields
- Updated ProductService to offerings[] + addOns[] + optional overview
- Created normalizeProductService that handles empty, legacy packages, new offerings, and mixed data
- 6 normalization tests all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Define new Offering-based types** - `a2c38c8` (feat)
2. **Task 2: Create normalization function with tests** - `bf45716` (feat)

## Files Created/Modified
- `src/types/plan.ts` - Replaced Package with Offering/OfferingImage/AddOn v2/ProductService v2
- `src/types/index.ts` - Updated barrel export (removed Package, added Offering/OfferingImage)
- `src/features/sections/product-service/normalize.ts` - normalizeProductService function with legacy format support
- `src/features/sections/product-service/normalize.test.ts` - 6 tests covering all normalization scenarios

## Decisions Made
- Old Package type fully removed from plan.ts (not kept as deprecated alias). Legacy format handled internally in normalize.ts via LegacyPackage interface
- Offering.price is `number | null` where null means "price on request"
- Legacy Package.includes array items folded into Offering.description as bullet points (prepended with bullet character)
- Legacy Package.duration mapped to Offering.priceLabel
- ID generation uses crypto.randomUUID with Math.random().toString(36).slice(2) fallback for test environments

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Expected TypeScript errors in product-service/index.tsx and export files due to removed Package type and packages → offerings rename. These files will be rewritten in Plans 03, 05, 06 as planned.

## Next Phase Readiness
- New types compile cleanly (no errors in types/ or normalize.ts)
- All 6 normalization tests pass
- Ready for 17-02-PLAN.md (Firebase Storage setup + image upload hook)

---
*Phase: 17-generic-product-service-offerings*
*Completed: 2026-02-18*
