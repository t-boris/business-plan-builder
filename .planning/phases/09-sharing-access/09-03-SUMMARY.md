---
phase: 09-sharing-access
plan: 03
subsystem: auth
tags: [rbac, viewer-role, read-only, ui-enforcement, useCanEdit]

# Dependency graph
requires:
  - phase: 09-sharing-access/09-01
    provides: Viewer role in BusinessRole type, Firestore security rules
provides:
  - useBusinessRole hook (returns current user's role on active business)
  - useCanEdit hook (returns true for owner/editor, false for viewer)
  - Role-aware useSection (skips Firestore saves for viewers)
  - canEdit boolean exposed to all 9 section components
  - Disabled editing UI for viewers across all surfaces
  - AI action bar hidden for viewers
  - Scenario controls disabled for viewers
affects: [09-sharing-access]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useCanEdit() hook for role-based UI gating"
    - "canEdit boolean from useSection for form field disabling"
    - "Silent save skip: viewers see local state changes but Firestore writes are suppressed"
    - "Pattern: readOnly={!canEdit || isPreview} for inputs, {canEdit && (...)} for action buttons"
    - "Disabled prop propagation for scenario controls component"

key-files:
  created:
    - src/hooks/use-business-role.ts
  modified:
    - src/hooks/use-section.ts
    - src/features/sections/executive-summary/index.tsx
    - src/features/sections/market-analysis/index.tsx
    - src/features/sections/product-service/index.tsx
    - src/features/sections/marketing-strategy/index.tsx
    - src/features/sections/operations/index.tsx
    - src/features/sections/financial-projections/index.tsx
    - src/features/sections/risks-due-diligence/index.tsx
    - src/features/sections/kpis-metrics/index.tsx
    - src/features/sections/launch-plan/index.tsx
    - src/features/scenarios/index.tsx
    - src/features/scenarios/scenario-manager.tsx
    - src/features/scenarios/scenario-controls.tsx

key-decisions:
  - "useCanEdit wraps AiActionBar at call sites rather than modifying the shared component"
  - "Scenario controls accept disabled prop and propagate to SliderInput/NumberInput"
  - "Financial projections uses readOnly={!canEdit} directly (no isPreview pattern)"

patterns-established:
  - "Role-gated UI: destructure canEdit from useSection, apply to inputs/buttons/selects"

issues-created: []

# Metrics
duration: 5min
completed: 2026-02-12
---

# Phase 9 Plan 3: Enforce Read-Only Mode for Viewers Summary

**useBusinessRole/useCanEdit hooks created, role-aware useSection skips saves, all 9 sections + scenarios disabled for viewers**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-12
- **Completed:** 2026-02-12
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Created `useBusinessRole` hook returning the current user's role on the active business
- Created `useCanEdit` hook returning true for owner/editor, false for viewer
- Made `useSection` role-aware: returns `canEdit` boolean and silently skips Firestore saves for viewers
- All 9 business plan section forms disabled for viewers (readOnly inputs, hidden add/remove buttons)
- AI action bar hidden for viewers (wrapped in `{canEdit && (...)}` at call sites)
- Scenario name input made readOnly for viewers
- Scenario Manager: "New" button disabled, "Delete" button hidden for viewers
- Scenario Controls: SliderInput and NumberInput accept and propagate `disabled` prop

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useBusinessRole hook and make useSection role-aware** - `8185476` (feat)
2. **Task 2: Disable editing UI for viewers across all surfaces** - `8f61112` (feat)

## Files Created/Modified
- `src/hooks/use-business-role.ts` - Created: useBusinessRole and useCanEdit hooks
- `src/hooks/use-section.ts` - Added canEdit to return type, guards debounceSave with canEdit check
- `src/features/sections/executive-summary/index.tsx` - canEdit gating on inputs, buttons, AI bar
- `src/features/sections/market-analysis/index.tsx` - canEdit gating on inputs, buttons, AI bar
- `src/features/sections/product-service/index.tsx` - canEdit gating on inputs, buttons, AI bar
- `src/features/sections/marketing-strategy/index.tsx` - canEdit gating on inputs, buttons, AI bar
- `src/features/sections/operations/index.tsx` - canEdit gating on inputs, selects, buttons, AI bar
- `src/features/sections/financial-projections/index.tsx` - canEdit gating on all P&L inputs, season controls, unit economics
- `src/features/sections/risks-due-diligence/index.tsx` - canEdit gating on inputs, selects, verdict select, AI bar
- `src/features/sections/kpis-metrics/index.tsx` - canEdit gating on KPI inputs, actuals toggle, AI bar
- `src/features/sections/launch-plan/index.tsx` - canEdit gating on stage inputs, task selects, buttons, AI bar
- `src/features/scenarios/index.tsx` - canEdit for scenario name input, disabled prop to DynamicScenarioControls
- `src/features/scenarios/scenario-manager.tsx` - canEdit for New/Delete buttons
- `src/features/scenarios/scenario-controls.tsx` - disabled prop on SliderInput, NumberInput, and range elements

## Decisions Made
- useCanEdit wraps AiActionBar at call sites rather than modifying the shared component
- Scenario controls accept disabled prop and propagate to SliderInput/NumberInput
- Financial projections uses readOnly={!canEdit} directly (no isPreview pattern since financial section has different structure)

## Deviations from Plan

None. All tasks executed as specified.

## Issues Encountered
None

## Next Phase Readiness
- Phase 09 (Sharing & Access) is now complete
- Viewer role enforcement is fully client-side (Firestore rules handle server-side from 09-01)
- All surfaces respect role-based access control

---
*Phase: 09-sharing-access*
*Completed: 2026-02-12*
