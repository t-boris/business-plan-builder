---
phase: 09-sharing-access
plan: 01
subsystem: auth
tags: [firestore, security-rules, invite, viewer-role, sharing]

# Dependency graph
requires:
  - phase: 01-firestore-data-model
    provides: Business types, Firestore service layer
  - phase: 02-business-crud
    provides: Business CRUD, role management functions
provides:
  - Viewer role in BusinessRole type
  - Reusable invite data model (BusinessInvite with active/revoked status)
  - Six invite CRUD functions (create, get, list, revoke, delete, accept)
  - Viewer-aware Firestore security rules
  - Invite acceptance self-add pattern in security rules
  - No email whitelist — Firestore roles as sole access control
affects: [09-sharing-access, 12-integration-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reusable invite links: doc ID is token, status is active/revoked, no expiration"
    - "Invite acceptance: _acceptingInviteId field for security rule verification via get()"
    - "Self-add to roles: isOnlySelfAddToRoles validates only requester's UID added"

key-files:
  created: []
  modified:
    - src/types/business.ts
    - src/lib/business-firestore.ts
    - firestore.rules
    - src/store/auth-atoms.ts
    - src/app/providers.tsx
    - src/features/auth/login-page.tsx

key-decisions:
  - "Reusable invite links: invite stays active after acceptance, multiple users can accept same link"
  - "Doc ID is the token: no separate token field, crypto.randomUUID() for invite IDs"
  - "No invite expiration: reusable links have no expiresAt field"
  - "ALLOWED_EMAILS removed: access control fully via Firestore roles map"

patterns-established:
  - "Invite acceptance pattern: updateDoc with _acceptingInviteId for security rule cross-doc verification"

issues-created: []

# Metrics
duration: 2min
completed: 2026-02-12
---

# Phase 9 Plan 1: Data Model, Security Rules, and Auth Cleanup Summary

**Viewer role, reusable invite CRUD, tightened Firestore rules with invite acceptance path, ALLOWED_EMAILS whitelist removed**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-12T08:44:09Z
- **Completed:** 2026-02-12T08:47:05Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Added viewer to BusinessRole and simplified BusinessInvite for reusable link pattern
- Six invite CRUD functions in business-firestore.ts (create, get, list, revoke, delete, accept)
- Firestore security rules rewritten with viewer read-only access, invite acceptance self-add, owner-only invite management
- Removed ALLOWED_EMAILS whitelist — any authenticated user can access app, Firestore roles control business access

## Task Commits

Each task was committed atomically:

1. **Task 1: Update types and add invite CRUD functions** - `4fa6762` (feat)
2. **Task 2: Rewrite Firestore security rules** - `89fbb09` (feat)
3. **Task 3: Remove ALLOWED_EMAILS whitelist** - `6fb21a4` (feat)

## Files Created/Modified
- `src/types/business.ts` - Added viewer to BusinessRole, simplified InviteStatus and BusinessInvite
- `src/lib/business-firestore.ts` - Added 6 invite CRUD functions (createInvite, getInvite, listBusinessInvites, revokeInvite, deleteInvite, acceptInvite)
- `firestore.rules` - Rewritten with viewer role, isOnlySelfAddToRoles, isValidInviteAcceptance, tightened invite rules
- `src/store/auth-atoms.ts` - Removed ALLOWED_EMAILS, simplified AuthStatus
- `src/app/providers.tsx` - Removed email whitelist checking logic from AuthListener
- `src/features/auth/login-page.tsx` - Removed denied status UI block and unused imports

## Decisions Made
- Reusable invite links: invite stays active after acceptance, multiple users can accept same link
- Doc ID is the token: no separate token field, crypto.randomUUID() for invite IDs
- No invite expiration: reusable links have no expiresAt field
- ALLOWED_EMAILS removed: access control fully via Firestore roles map

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleaned up unused imports in login-page.tsx**
- **Found during:** Task 3 (Remove ALLOWED_EMAILS whitelist)
- **Issue:** After removing the denied status block, LogOut import, user and signOut destructured variables became unused — would fail lint/build
- **Fix:** Removed LogOut from lucide-react import, simplified useAuth destructuring
- **Files modified:** src/features/auth/login-page.tsx
- **Verification:** TypeScript compiles, build passes
- **Committed in:** 6fb21a4 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary cleanup to keep build passing. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Data model and security rules ready for invite UI (09-02)
- Invite CRUD functions available for AcceptInvite page and ShareDialog
- Viewer role available for read-only enforcement (09-03)

---
*Phase: 09-sharing-access*
*Completed: 2026-02-12*
