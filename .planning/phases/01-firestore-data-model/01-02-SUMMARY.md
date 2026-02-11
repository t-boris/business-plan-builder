---
phase: 01-firestore-data-model
plan: 02
subsystem: database
tags: [typescript, firestore, multi-tenant, service-layer, security-rules, batch-write]

# Dependency graph
requires:
  - phase: 01-firestore-data-model/01-01
    provides: Multi-business TypeScript type definitions (Business, BusinessTemplate, BusinessSection, BusinessScenario, etc.)
provides:
  - Firestore service layer for all multi-business operations (business-firestore.ts)
  - Business CRUD functions (create, get, update, delete, getUserBusinesses)
  - Template reading functions (getTemplate, listTemplates)
  - Template-based business creation with writeBatch (createBusinessFromTemplate)
  - Business-scoped section and scenario operations
  - Role management functions (addBusinessRole, removeBusinessRole)
  - Role-based Firestore security rules for multi-tenant access
affects: [02-business-crud, 03-dynamic-business-context, 04-template-creation, 06-variable-library, 09-sharing-access]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "writeBatch for atomic multi-document creation (business + sections + default scenario)"
    - "Firestore dot notation for partial map updates (roles.${uid})"
    - "deleteField() for removing map entries"
    - "get() calls in subcollection rules to inherit parent document access"
    - "hasRole() helper function in security rules to avoid redundant get() calls on parent document"

key-files:
  created: [src/lib/business-firestore.ts, firestore.rules]
  modified: []

key-decisions:
  - "Client-side sort for getUserBusinesses instead of Firestore orderBy (avoids composite index requirement with inequality filter)"
  - "Spread id from snap.id into returned objects for business and scenario documents"
  - "Subcollection rules use get() to read parent business roles (1 get per access, well within 10-call limit)"

patterns-established:
  - "business-firestore.ts as the service layer for all multi-business Firestore operations"
  - "writeBatch for atomic multi-document creation patterns"
  - "Firestore security rules with hasRole() helper for role-based access control"
  - "Subcollection access inherits from parent document roles via get() calls"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 1 Plan 02: Firestore Service Layer & Security Rules Summary

**17 exported Firestore service functions for multi-business CRUD, template reading, batch business creation, scoped sections/scenarios, and role management, plus role-based security rules for 6 collection paths**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T22:10:00Z
- **Completed:** 2026-02-11T22:13:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Built complete Firestore service layer with 17 exported async functions covering business CRUD, templates, batch creation, sections, scenarios, and role management
- Implemented createBusinessFromTemplate using writeBatch for atomic creation of business + all template sections + default scenario in a single commit
- Established role-based Firestore security rules covering 6 collection paths (templates, businesses, sections, scenarios, state, users, invites) plus legacy plans path

## Task Commits

Each task was committed atomically:

1. **Task 1: Create business Firestore service layer** - `307dd7f` (feat)
2. **Task 2: Create Firestore security rules for multi-business access** - `f4eecbe` (feat)

## Files Created/Modified
- `src/lib/business-firestore.ts` - All multi-business Firestore operations (17 exported functions, 293 lines)
- `firestore.rules` - Role-based security rules for multi-tenant access (87 lines)

## Decisions Made
- Client-side sorting for getUserBusinesses (sort by updatedAt descending) instead of Firestore orderBy to avoid composite index requirement when combined with inequality filter on roles map
- Spread `snap.id` into returned business/scenario objects to populate the `id` field from Firestore document ID rather than stored data
- Subcollection security rules use `get()` to read parent business document's roles map (1 get call per access, well within Firestore's 10-call limit per rule evaluation)
- Business-scoped sections use `sectionKey` as the document ID (deterministic paths) while scenarios use auto-generated IDs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Service layer is complete and ready for integration into UI components and hooks
- Security rules deployed via `firestore.rules` file (will take effect on next `firebase deploy`)
- Legacy `plans/` path preserved for backward compatibility until Phase 3 migration
- All functions compile cleanly with `npx tsc --noEmit`

---
*Phase: 01-firestore-data-model*
*Completed: 2026-02-11*
