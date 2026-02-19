---
phase: 17-generic-product-service-offerings
plan: 03
subsystem: ui
tags: [react, offering, product-service, add-on-linking, crud, normalization]

# Dependency graph
requires:
  - phase: 17-generic-product-service-offerings
    provides: Offering/AddOn v2 types, normalizeProductService function
provides:
  - Generic offering card UI (no tiers)
  - Add-on catalog with description/priceLabel
  - Multi-select add-on linking per offering
  - Overview textarea for product/service line
  - Legacy data normalization on first load
affects: [17-04, 17-05, 17-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Normalization-on-mount: useEffect runs normalizeProductService once on first load"
    - "Add-on reference cleanup: removeAddOn strips deleted add-on ids from all offerings"
    - "Toggle selector pattern: state-driven inline checkbox list (no popover dependency)"

key-files:
  created: []
  modified:
    - src/features/sections/product-service/index.tsx

key-decisions:
  - "Used inline toggle checkbox list instead of Popover (no Popover component available in UI kit)"
  - "Add-on sync cleanup integrated into removeAddOn rather than separate effect"
  - "Overview textarea placed above offerings section for document flow"

patterns-established:
  - "Multi-select linking: checkbox list toggle with state-tracked open selector"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 17 Plan 03: Product & Service UI Rewrite Summary

**Complete rewrite of Product & Service section from tier-based packages to generic offering cards with add-on catalog and multi-select linking**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T03:53:13Z
- **Completed:** 2026-02-19T03:55:57Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Removed all tier-related code (tierStyles, PACKAGE_FIELDS, ADDON_SUGGESTIONS, Star/Crown/Sparkles icons, colored borders)
- Added overview textarea for product/service line description
- Implemented neutral offering cards with name, price (with null = "on request" badge), priceLabel, and description
- Built add-on catalog with name, description, price, and priceLabel fields
- Implemented multi-select add-on linking: chips display, toggle checkbox selector, reference cleanup on delete
- Preserved AI suggestion flow (generate/improve/expand/accept/reject)
- Added legacy data normalization on first load via normalizeProductService

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite product-service component with offering model** - `286abad` (feat)
2. **Task 2: Add-on multi-select linking for offerings** - `cfbcb80` (feat)

## Files Created/Modified
- `src/features/sections/product-service/index.tsx` - Complete rewrite: removed 191 lines of tier code, added 246 lines of generic offering UI with add-on linking

## Decisions Made
- Used inline toggle checkbox list for add-on linking instead of Popover (no Popover component in UI kit, avoids adding new shadcn primitive)
- Add-on reference cleanup integrated directly into removeAddOn function rather than a separate useEffect
- Overview textarea placed at top of section (before offerings) for natural document flow
- Pre-existing build errors in export files (packages reference) are expected and will be fixed in Plan 06

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in export files (business-plan-view.tsx, index.tsx, BusinessPlanDocument.tsx) due to removed Package type from Plan 01. These are expected and will be resolved in Plan 06 (Export update). No errors in the product-service component itself.

## Next Phase Readiness
- Product & Service section fully functional with new offering model
- Ready for 17-04-PLAN.md (AI schema + prompts update)
- Add-on linking infrastructure in place for AI to generate addOnIds
- Image placeholder comment in offering cards ready for Plan 05

---
*Phase: 17-generic-product-service-offerings*
*Completed: 2026-02-18*
