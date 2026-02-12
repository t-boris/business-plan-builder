---
phase: 05-business-profile-section-config
plan: 01
subsystem: ui
tags: [jotai, firestore, radix-ui, shadcn, optimistic-update]

# Dependency graph
requires:
  - phase: 02-business-crud
    provides: useBusinesses hook, business-firestore service layer
  - phase: 03-dynamic-business-context
    provides: activeBusinessAtom, businessListAtom
provides:
  - updateProfile method for inline business profile editing
  - toggleSection method for section on/off switching
  - Switch UI component for toggle controls
  - Collapsible UI component for expandable header bar
affects: [05-02, 08-business-aware-ai, 10-dashboard-navigation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optimistic local update + fire-and-forget Firestore persistence"

key-files:
  created:
    - src/components/ui/switch.tsx
    - src/components/ui/collapsible.tsx
  modified:
    - src/hooks/use-businesses.ts

key-decisions:
  - "Full profile spread for Firestore setDoc merge (not partial)"
  - "No debouncing in hook — header bar component handles debounce for profile fields"

patterns-established:
  - "Optimistic update pattern: update businessListAtom immediately, persist to Firestore in background with .catch() error logging"

issues-created: []

# Metrics
duration: 2min
completed: 2026-02-12
---

# Phase 5 Plan 01: Business Profile & Section Config Data Layer Summary

**Optimistic updateProfile and toggleSection methods on useBusinesses hook, plus shadcn Switch and Collapsible UI primitives**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-12T01:10:29Z
- **Completed:** 2026-02-12T01:12:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- useBusinesses hook now exposes `updateProfile(fields)` for inline business profile editing with optimistic local state
- useBusinesses hook now exposes `toggleSection(slug)` for toggling sections on/off with optimistic local state
- Both methods persist to Firestore via `updateBusiness` in the background (fire-and-forget with error logging)
- shadcn Switch component installed for section toggle controls
- shadcn Collapsible component installed for expandable header bar

## Task Commits

Each task was committed atomically:

1. **Task 1: Add updateProfile and toggleSection to useBusinesses hook** - `0f2aa5d` (feat)
2. **Task 2: Add shadcn Switch and Collapsible UI primitives** - `887e9e5` (chore)

## Files Created/Modified
- `src/hooks/use-businesses.ts` - Added updateProfile and toggleSection methods with optimistic updates
- `src/components/ui/switch.tsx` - shadcn Switch component (radix-ui based)
- `src/components/ui/collapsible.tsx` - shadcn Collapsible, CollapsibleTrigger, CollapsibleContent exports

## Decisions Made
- Full profile object spread for Firestore `setDoc` with `merge: true` — ensures correct deep merge behavior by passing complete profile with overrides, not just partial fields
- No debouncing added at hook level — the header bar component (Plan 05-02) will handle debouncing for profile fields; `toggleSection` is a discrete action that saves immediately

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Data layer complete for Plan 05-02's BusinessHeaderBar component
- `updateProfile` ready for debounced inline profile editing
- `toggleSection` ready for Switch-based section toggling
- Switch and Collapsible components available for header bar UI

---
*Phase: 05-business-profile-section-config*
*Completed: 2026-02-12*
