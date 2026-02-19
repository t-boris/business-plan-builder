---
phase: 17-generic-product-service-offerings
plan: 06
subsystem: export
tags: [web-export, pdf-export, offerings, images, normalize, react-pdf]

# Dependency graph
requires:
  - phase: 17-generic-product-service-offerings
    provides: Offering/AddOn/ProductService v2 types from Plan 01
  - phase: 17-generic-product-service-offerings
    provides: normalizeProductService from Plan 03
  - phase: 17-generic-product-service-offerings
    provides: Offering image upload from Plan 05
provides:
  - Web export rendering of Offering-based product-service model with images
  - PDF export rendering of Offering-based product-service model with images
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Normalize-on-read: both web and PDF exports call normalizeProductService() to handle legacy data"
    - "Guard image rendering: offering.image?.url checked before rendering img/Image to prevent crashes"
    - "IIFE pattern for inline normalization in JSX: (() => { ... })()"

key-files:
  created: []
  modified:
    - src/features/export/business-plan-view.tsx
    - src/features/export/pdf/BusinessPlanDocument.tsx
    - src/features/export/index.tsx

key-decisions:
  - "Use normalizeProductService for backward compatibility with legacy packages data in Firestore"
  - "Offering images in web export: w-full h-24 object-cover; in PDF: height 60, objectFit cover"
  - "Price null renders as 'On request'; priceLabel shown as small text next to price"
  - "Linked add-ons resolved from addOnIds and shown as comma-separated names with prices"
  - "Pre-existing build errors in adoption-block.tsx and logger.test.ts left untouched (not in scope)"

patterns-established:
  - "Export normalize pattern: always call normalizeProductService when reading ProductService data for rendering"

issues-created: []

# Metrics
duration: 5min
completed: 2026-02-18
---

# Phase 17 Plan 06: Export Update and Verification Summary

**Web and PDF export updated to render Offering-based product-service model with images, price labels, linked add-ons, and backward-compatible normalization**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T06:00:00Z
- **Completed:** 2026-02-19T06:05:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Replaced old packages grid in web export with offerings grid supporting images, null prices, price labels, and linked add-ons
- Replaced old packages rendering in PDF export with offerings using @react-pdf/renderer Image component for offering images
- Added normalizeProductService import and usage in both web and PDF exports for backward compatibility
- Updated overview rendering in both exports (shown as paragraph before offerings when non-empty)
- Updated add-ons rendering in both exports to include description and priceLabel fields
- Fixed defaultProductService in export/index.tsx to use new offerings[] field instead of removed packages[]
- All 50 tests pass; lint clean on all modified files

## Task Commits

Each task was committed atomically:

1. **Task 1: Update web export** - `c5d8fed` (feat)
2. **Task 2: Update PDF export** - `eabaee3` (feat)
3. **Task 3: Fix export index default + verification** - `ecc22f4` (feat)

## Files Created/Modified
- `src/features/export/business-plan-view.tsx` - Replaced packages grid with offerings grid, added normalizeProductService, image rendering, price label, linked add-ons
- `src/features/export/pdf/BusinessPlanDocument.tsx` - Replaced packages section with offerings, added normalizeProductService, Image component for offering images, price label, linked add-ons
- `src/features/export/index.tsx` - Updated defaultProductService to use offerings[] instead of removed packages[]

## Decisions Made
- normalizeProductService called inline using IIFE pattern in JSX for clean scoping
- Offering images guarded with `offering.image?.url &&` before rendering to prevent crashes with undefined src
- PDF Image uses height: 60, objectFit: 'cover', borderRadius: 4 for consistent card appearance
- Web image uses h-24 object-cover for compact grid display
- Pre-existing TypeScript errors in adoption-block.tsx (recharts Formatter type) and logger.test.ts (parameter type mismatch) were not modified as they are out of scope for this plan

## Deviations from Plan

- Additional file `src/features/export/index.tsx` needed updating (its defaultProductService still used old `packages` field)
- Pre-existing build errors in 2 unrelated files prevent fully clean `tsc -b` build, but these are not related to product-service exports

## Issues Encountered
- Pre-existing TS errors in adoption-block.tsx and logger.test.ts cause build to fail at type-check stage; these errors predate this plan and are not related to the product-service changes

## Next Phase Readiness
- All export rendering fully migrated to Offering-based model
- Web and PDF exports handle both new and legacy data formats via normalizeProductService
- Offering images render correctly in both web and PDF exports
- Phase 17 export migration complete

---
*Phase: 17-generic-product-service-offerings*
*Completed: 2026-02-18*
