---
phase: 17-generic-product-service-offerings
plan: 05
subsystem: ui
tags: [image-upload, firebase-storage, offering-cards, file-picker]

# Dependency graph
requires:
  - phase: 17-generic-product-service-offerings
    provides: Offering/AddOn/ProductService v2 types with OfferingImage from Plan 01
  - phase: 17-generic-product-service-offerings
    provides: useImageUpload hook from Plan 02
  - phase: 17-generic-product-service-offerings
    provides: Product & Service UI rewrite with offering cards from Plan 03
provides:
  - Image upload/preview/replace/remove UI for each offering card
  - Image cleanup on offering deletion
affects: [17-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hidden file input pattern: shared <input type=file> with ref, triggered per offering via index tracking"
    - "Per-offering upload tracking: uploadingOfferingId + errorOfferingId state for targeted progress/error display"

key-files:
  created: []
  modified:
    - src/features/sections/product-service/index.tsx

key-decisions:
  - "Used regular functions instead of useCallback for image handlers since they are declared after early return guard"
  - "Single shared hidden file input with pendingUploadIndexRef to track which offering triggered the picker"
  - "Error display uses separate errorOfferingId state that persists after upload completes, auto-clears after 5 seconds"
  - "Image cleanup on offering deletion uses best-effort pattern (catch-and-ignore) to not block deletion"

patterns-established:
  - "Per-entity upload tracking: use separate state for uploading entity ID and error entity ID"

issues-created: []

# Metrics
duration: 5min
completed: 2026-02-18
---

# Phase 17 Plan 05: Offering Image Upload UI Summary

**Image upload/preview/replace/remove capability for each offering card using the existing Firebase Storage hook**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T04:00:00Z
- **Completed:** 2026-02-19T04:05:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added image preview section at top of each offering card with hover overlay for Replace/Remove actions
- Added placeholder area with "Add image" button (ImagePlus icon) for offerings without images
- Integrated useImageUpload hook for upload/remove with progress bar overlay during upload
- Added per-offering error display (red banner below image area) with 5-second auto-clear
- Image cleanup on offering deletion via best-effort Storage deletion before state update
- Hidden file input pattern with ref for triggering file picker per offering
- Fixed react-hooks/rules-of-hooks lint error by converting useCallback to regular functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add image upload UI to offering cards** - `21b90e3` (feat)
2. **Task 2: Handle image cleanup on offering deletion** - `8e7ec7b` (feat)
3. **Lint fix: Convert useCallback to regular functions** - `3a491eb` (feat)

## Files Created/Modified
- `src/features/sections/product-service/index.tsx` - Added image upload UI (preview, placeholder, progress, error display), image cleanup on deletion, useImageUpload integration

## Decisions Made
- Regular functions used instead of useCallback for triggerImagePicker, handleFileSelected, handleRemoveImage since they appear after the early return guard for isLoading
- Single hidden file input shared across all offering cards, with pendingUploadIndexRef tracking which offering triggered the picker
- errorOfferingId state persists after upload completes so error banner remains visible to the user, auto-clears after 5 seconds
- Image cleanup on offering deletion is best-effort: errors from Storage deletion do not block offering removal from state
- Upload path format: `offerings/{businessId}/{offeringId}/{fileName}`

## Deviations from Plan

- Converted useCallback hooks to regular functions to fix react-hooks/rules-of-hooks lint error (hooks cannot be called after early return)
- Added errorOfferingId state (not in plan) to properly track which offering should show the error banner after upload failure

## Issues Encountered
- react-hooks/rules-of-hooks error: useCallback was placed after the early return guard for isLoading, violating Rules of Hooks. Resolved by converting to regular functions.

## Next Phase Readiness
- Image upload UI fully integrated with offering cards
- Ready for 17-06-PLAN.md (Export updates for offering-based model)
- Lint clean (0 errors, only pre-existing warnings)
- TypeScript compilation passes (only pre-existing errors in unrelated files)

---
*Phase: 17-generic-product-service-offerings*
*Completed: 2026-02-18*
