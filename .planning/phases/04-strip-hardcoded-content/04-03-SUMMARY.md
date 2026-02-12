---
phase: 04-strip-hardcoded-content
plan: 03
subsystem: ui
tags: [react, lucide, pdf, export, dashboard, login, risks, kpis, launch-plan]

# Dependency graph
requires:
  - phase: 04-strip-hardcoded-content/04-01
    provides: Generic constants, zeroed DEFAULT_SCENARIO_VARIABLES, renamed atoms
provides:
  - Empty/zero defaults for risks-due-diligence, kpis-metrics, launch-plan sections
  - Generic dashboard title and descriptions
  - Generic login page branding (Briefcase icon, no "Fun Box")
  - Generic export/PDF rendering with empty fallback data
  - All scenario variable references use new names (priceTier1/2/3, staffCount)
  - CoverPage accepts businessName prop
affects: [05-business-profile, 10-dashboard, 11-export-updates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "businessName prop pattern for CoverPage (future dynamic name)"
    - "Flat season coefficients as default (no business-specific seasonality)"

key-files:
  created: []
  modified:
    - src/features/sections/risks-due-diligence/index.tsx
    - src/features/sections/kpis-metrics/index.tsx
    - src/features/sections/launch-plan/index.tsx
    - src/features/dashboard/index.tsx
    - src/features/auth/login-page.tsx
    - src/features/export/index.tsx
    - src/features/export/business-plan-view.tsx
    - src/features/export/pdf/BusinessPlanDocument.tsx
    - src/features/export/pdf/CoverPage.tsx
    - src/features/export/pdf/PageFooter.tsx

key-decisions:
  - "Flat season coefficients [1,1,...,1] as dashboard default instead of importing from financial-projections"
  - "Calendar month order (Jan-Dec) instead of Fun Box fiscal year (Mar-Feb)"
  - "Briefcase Lucide icon for login page instead of hardcoded letter"
  - "CoverPage accepts optional businessName prop, falls back to 'Business Plan'"

patterns-established:
  - "businessName prop pattern: optional prop with fallback for generic display"

issues-created: []

# Metrics
duration: 8min
completed: 2026-02-12
---

# Phase 4 Plan 3: Clean Remaining Files Summary

**Strip all Fun Box content from remaining section components, dashboard, login page, and all export/PDF files — zero Fun Box references remain in src/**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-12T00:14:43Z
- **Completed:** 2026-02-12T00:22:20Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- All 3 remaining section components (risks-due-diligence, kpis-metrics, launch-plan) have empty/zero defaults
- Dashboard shows "Business Planning Dashboard" with generic descriptions, flat season coefficients, Jan-Dec calendar months
- Login page has generic branding with Briefcase icon instead of "F" logo
- All export files use empty/zero fallback data, generic headers/footers
- PDF filename changed from 'fun-box-business-plan.pdf' to 'business-plan.pdf'
- All scenario variable references updated from old names (priceStarter/Explorer/VIP, crewCount) to new names (priceTier1/2/3, staffCount)
- CoverPage accepts optional businessName prop for future dynamic naming
- Zero Fun Box, Miami, Jellyfish, or ocean content anywhere in src/

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean risks-due-diligence, kpis-metrics, launch-plan** - `69fad0f` (feat)
2. **Task 2: Clean dashboard, login page, and export/PDF files** - `e044e10` (feat)

## Files Created/Modified
- `src/features/sections/risks-due-diligence/index.tsx` - Empty defaults, helpful empty state messages
- `src/features/sections/kpis-metrics/index.tsx` - Zeroed KPI targets, removed DEFAULT_KPI_TARGETS import
- `src/features/sections/launch-plan/index.tsx` - Empty stages, added empty state message
- `src/features/dashboard/index.tsx` - Generic title/descriptions, flat coefficients, Jan-Dec months
- `src/features/auth/login-page.tsx` - Briefcase icon, generic "Welcome" title
- `src/features/export/index.tsx` - Empty fallback data, generic PDF filename
- `src/features/export/business-plan-view.tsx` - Empty defaults, generic header/footer, new variable names
- `src/features/export/pdf/BusinessPlanDocument.tsx` - Generic Document title/author
- `src/features/export/pdf/CoverPage.tsx` - businessName prop, generic fallback
- `src/features/export/pdf/PageFooter.tsx` - Generic "Business Plan" footer text

## Decisions Made
- Used flat coefficients [1,1,...,1] as local constant in dashboard instead of importing SEASON_PRESET_MIAMI_KIDS (which 04-02 is removing)
- Changed month labels from Mar-Feb (Fun Box fiscal year) to Jan-Dec (standard calendar)
- Used Briefcase Lucide icon for login page branding (generic business tool aesthetic)
- Added businessName optional prop to CoverPage for future Phase 11 dynamic naming

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed broken DEFAULT_KPI_TARGETS, DEFAULT_PACKAGES, DEFAULT_MARKETING_CHANNELS imports**
- **Found during:** Task 1 and Task 2
- **Issue:** 04-01 removed these constants from constants.ts but left import statements in kpis-metrics, export/index.tsx, and business-plan-view.tsx
- **Fix:** Replaced all imports with inline zero/empty values
- **Files modified:** kpis-metrics/index.tsx, export/index.tsx, export/business-plan-view.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 69fad0f, e044e10

**2. [Rule 3 - Blocking] Removed unused MonthlyProjection import from export files**
- **Found during:** Task 2
- **Issue:** After removing generateDefaultMonths(), MonthlyProjection type import was unused
- **Fix:** Removed from import lists in export/index.tsx and business-plan-view.tsx
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** e044e10

---

**Total deviations:** 2 auto-fixed (both blocking — broken imports from 04-01 constant removal)
**Impact on plan:** Essential fixes for compilation. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Phase 4 complete — all 3 plans finished
- Zero Fun Box content remains anywhere in src/
- Full TypeScript build succeeds
- Ready for Phase 5 (Business Profile & Section Config)

---
*Phase: 04-strip-hardcoded-content*
*Completed: 2026-02-12*
