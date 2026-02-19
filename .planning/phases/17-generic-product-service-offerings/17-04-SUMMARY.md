---
phase: 17-generic-product-service-offerings
plan: 04
subsystem: ai
tags: [zod, ai-prompts, industry-overlays, offering-model, gemini]

# Dependency graph
requires:
  - phase: 17-generic-product-service-offerings
    provides: Offering/AddOn/ProductService v2 types from Plan 01
provides:
  - Updated Zod schemas for AI-generated Offering-based content
  - Enriched generate/improve/expand prompts for product-service section
  - 6 industry-specific overlays for product-service generation
affects: [17-05, 17-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AI schema parity: Zod schemas in section-prompts.ts mirror TypeScript interfaces in plan.ts"
    - "Industry overlay pattern: business-type-specific prompt enrichment for product-service"

key-files:
  created: []
  modified:
    - src/lib/ai/section-prompts.ts

key-decisions:
  - "Tier terminology explicitly prohibited in generate prompt (Starter, Basic, Pro, Premium, Enterprise)"
  - "AI generates IDs using off-N and addon-N format for cross-referencing"
  - "OfferingSchema uses nullable price (z.number().nullable()) matching Offering.price type"

patterns-established:
  - "Descriptive offering naming: AI instructed to use names reflecting what the offering is, not tier labels"

issues-created: []

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 17 Plan 04: AI Schema & Prompts Update Summary

**Offering-based Zod schemas, descriptive prompts (no tier terminology), and 6 industry overlays for business-type-aware product-service generation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T03:53:08Z
- **Completed:** 2026-02-19T03:55:05Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Replaced PackageSchema with OfferingSchema (id, name, description, price|null, priceLabel, addOnIds)
- Updated AddOnSchema with id, optional description, and priceLabel fields
- Replaced ProductServiceSchema packages[] with offerings[] + addOns[] + optional overview
- Rewrote generate/improve/expand prompts for descriptive offering-based content
- Added product-service industry overlays for saas, restaurant, retail, service, event, manufacturing

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ProductService Zod schema and prompts** - `eaf2790` (feat)
2. **Task 2: Add industry overlays for product-service** - `cad0e2b` (feat)

## Files Created/Modified
- `src/lib/ai/section-prompts.ts` - Replaced PackageSchema/AddOnSchema/ProductServiceSchema with Offering-based schemas, updated prompts, added 6 industry overlays

## Decisions Made
- Tier terminology (Starter, Basic, Pro, Premium, Enterprise) explicitly prohibited in generate prompt instruction
- AI generates IDs using `off-1`, `off-2` format for offerings and `addon-1`, `addon-2` format for add-ons
- OfferingSchema.price uses `z.number().nullable()` to match the TypeScript `number | null` type
- No product-service overlay added for `custom` business type (uses base prompts as designed)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- AI schemas and prompts fully aligned with Offering model from Plan 01
- Ready for 17-05-PLAN.md (Offering image upload UI)
- All TypeScript compilation passes, lint clean (0 errors)

---
*Phase: 17-generic-product-service-offerings*
*Completed: 2026-02-18*
