---
phase: 03-dynamic-business-context
plan: 02
subsystem: ui
tags: [react-router, jotai, sidebar, routing, url-driven-context]

# Dependency graph
requires:
  - phase: 02-business-crud
    provides: Business CRUD, sidebar, router, business list/create/delete pages
  - phase: 03-dynamic-business-context (plan 01)
    provides: Business-scoped data layer (useSection, ScenarioSync, business-firestore)
provides:
  - Business-scoped URL structure (/business/:businessId/section-name)
  - BusinessContextLayout syncing URL param -> activeBusinessIdAtom
  - Dynamic sidebar filtering by enabledSections
  - RootRedirect with localStorage-based business restoration
  - BusinessNotFoundPage for invalid business IDs
affects: [04-strip-hardcoded, 05-section-config, 10-dashboard-navigation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "URL as single source of truth for active business (BusinessContextLayout syncs URL -> atom)"
    - "Dynamic sidebar filtering by business.enabledSections array"
    - "Slug-based navigation with /business/:businessId/ prefix"

key-files:
  created: []
  modified:
    - src/app/router.tsx
    - src/app/layout.tsx
    - src/components/app-sidebar.tsx
    - src/hooks/use-businesses.ts
    - src/features/businesses/index.tsx
    - src/features/businesses/create-business.tsx

key-decisions:
  - "URL is single source of truth for active business — BusinessContextLayout syncs URL param to atom and localStorage"
  - "loadBusinesses stripped of activeBusinessId selection logic — router handles business context"
  - "removeBusiness handles data only — caller handles navigation after deletion"
  - "Sidebar section filtering uses slug matching against business.enabledSections"

patterns-established:
  - "BusinessContextLayout pattern: URL param -> atom sync at route wrapper level"
  - "RootRedirect with localStorage fallback for session continuity"
  - "Slug-based NavItem definitions for dynamic URL construction"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 3 Plan 02: Business-Scoped Routing Summary

**Replaced flat route structure with /business/:businessId/ URL-scoped routing, dynamic sidebar filtering by enabledSections, and URL-driven business context**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T23:43:50Z
- **Completed:** 2026-02-11T23:46:46Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- All routes now live under `/business/:businessId/` — bookmarkable, shareable, browser back/forward works naturally
- BusinessContextLayout validates business exists and syncs URL param to activeBusinessIdAtom + localStorage
- Sidebar dynamically shows only sections from activeBusiness.enabledSections (not full hardcoded list)
- Business switcher navigates to `/business/${newId}` (dashboard), triggering full context switch
- Root `/` redirects to last-used business from localStorage, or `/businesses` if none
- Invalid business IDs show a clear 404 page with link to `/businesses`

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor router for /business/:businessId/ URL structure** - `adfe076` (feat)
2. **Task 2: Update sidebar and layout for URL-driven navigation** - `5624e28` (feat)

## Files Created/Modified
- `src/app/router.tsx` - Added BusinessContextLayout, BusinessNotFoundPage, RootRedirect; restructured route tree with /business/:businessId/ prefix
- `src/app/layout.tsx` - Updated breadcrumbs to use URL-derived section slug instead of flat routeTitles record
- `src/components/app-sidebar.tsx` - Dynamic nav URLs with businessId prefix, enabledSections filtering, navigate-based business switcher
- `src/hooks/use-businesses.ts` - Stripped loadBusinesses of activeBusinessId logic, simplified switchBusiness to localStorage-only, removeBusiness data-only
- `src/features/businesses/index.tsx` - Business card navigates to /business/${id}, delete dialog navigates after deletion
- `src/features/businesses/create-business.tsx` - Navigates to /business/${newId} after creation, back link goes to /businesses

## Decisions Made
- URL is single source of truth for active business — BusinessContextLayout syncs URL param to atom and localStorage
- loadBusinesses stripped of activeBusinessId selection logic — router now handles all business context
- removeBusiness handles data operations only — caller (business list page) handles navigation after deletion
- Sidebar section filtering uses slug matching against business.enabledSections array

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Phase 3 complete — all data and routing is fully business-scoped
- Every page lives under `/business/:businessId/` with URL as source of truth
- Dynamic sidebar respects enabledSections per business
- Ready for Phase 4 (Strip Hardcoded Content) — no blockers or concerns

---
*Phase: 03-dynamic-business-context*
*Completed: 2026-02-11*
