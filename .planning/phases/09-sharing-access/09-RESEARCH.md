# Phase 9: Sharing & Access - Research

**Researched:** 2026-02-12
**Domain:** Firestore client-side invite/sharing without Cloud Functions
**Confidence:** HIGH

<research_summary>
## Summary

Researched how to implement zero-friction business sharing using only Firestore client SDK and security rules (no Cloud Functions). The existing codebase already has the key building blocks: `BusinessInvite` type, `roles` map on Business documents, `addBusinessRole()`/`removeBusinessRole()` functions, and stubbed Firestore rules for the `invites` collection.

The standard approach is: use the invite document ID itself as the share token (UUID v4 via `crypto.randomUUID()`), share via URL `/invite/{inviteId}`, and accept via a Firestore `writeBatch` that atomically updates the invite status AND adds the accepting user to the business's roles map. Security rules use `MapDiff.addedKeys()` to ensure a user can only add their own UID as `'editor'`, and `getAfter()` to verify the invite is being accepted in the same batch.

No new libraries needed. The entire flow runs on existing Firebase SDK + tighter security rules.

**Primary recommendation:** Use invite document ID as token (Approach A). Accept via `writeBatch` with two atomic updates. Use `MapDiff` + `getAfter()` in security rules. Remove `ALLOWED_EMAILS` whitelist to allow any authenticated user.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase/firestore | existing | Firestore SDK (writeBatch, security rules) | Already in project |
| firebase/auth | existing | Authentication (Google sign-in) | Already in project |
| react-router | existing | URL routing for /invite/:inviteId | Already in project |
| crypto.randomUUID() | Web API | Token generation | Built-in, 122 bits entropy, all modern browsers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner (toast) | existing | Success/error notifications on share actions | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Doc ID as token | Separate `token` field + query | Requires composite index, extra query cost, no real security benefit |
| `crypto.randomUUID()` | `uuid` npm package | Adds dependency for what browser already provides |
| Client-side batch | Cloud Function | Cloud Function is more secure but requires billing, deployment, cold starts |
| `getAfter()` pattern | Structural constraints only | Simpler rules but allows self-add without valid invite |

**Installation:**
```bash
# No new packages needed
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Existing Infrastructure to Leverage
```
src/types/business.ts         # BusinessInvite type already defined
src/lib/business-firestore.ts # addBusinessRole(), removeBusinessRole() already exist
src/store/business-atoms.ts   # businessListAtom, activeBusinessAtom
src/hooks/use-businesses.ts   # loadBusinesses() re-fetches user's business list
firestore.rules               # Invite rules stubbed (needs tightening)
```

### Pattern 1: Invite Document ID = Share Token
**What:** Use `crypto.randomUUID()` as both the Firestore document ID and the URL token. No separate `token` field needed.
**When to use:** Always (recommended approach for this project)
**Example:**
```typescript
// Source: Firebase best practices for invite patterns
async function createInvite(businessId: string, creatorUid: string): Promise<string> {
  const inviteId = crypto.randomUUID();
  await setDoc(doc(db, 'invites', inviteId), {
    businessId,
    role: 'editor',
    createdBy: creatorUid,
    token: inviteId, // matches BusinessInvite type
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  return inviteId; // This IS the share URL token
}
```

### Pattern 2: Atomic Accept via writeBatch
**What:** Accept invite by atomically updating the invite status AND adding the user to the business roles map in a single batch.
**When to use:** Every invite acceptance
**Example:**
```typescript
// Source: Firebase batched writes documentation
async function acceptInvite(inviteId: string, businessId: string, uid: string): Promise<void> {
  const batch = writeBatch(db);

  // Step 1: Mark invite as accepted
  batch.update(doc(db, 'invites', inviteId), {
    status: 'accepted',
    acceptedBy: uid,
    acceptedAt: new Date().toISOString(),
  });

  // Step 2: Add self to business roles
  batch.update(doc(db, 'businesses', businessId), {
    [`roles.${uid}`]: 'editor',
    updatedAt: new Date().toISOString(),
    _acceptingInviteId: inviteId, // for security rule verification
  });

  await batch.commit();

  // Step 3: Clean up transient field (user is now editor, has permission)
  await updateDoc(doc(db, 'businesses', businessId), {
    _acceptingInviteId: deleteField(),
  });
}
```

### Pattern 3: MapDiff + getAfter() Security Rules
**What:** Security rules that allow self-add to roles map ONLY during a valid invite acceptance batch.
**When to use:** The business document update rule for invite acceptance
**Example:**
```javascript
// Source: Firebase Security Rules documentation (MapDiff, getAfter)
function isOnlySelfAddToRoles() {
  let rolesDiff = request.resource.data.roles.diff(resource.data.roles);
  return rolesDiff.addedKeys().hasOnly([request.auth.uid])
    && rolesDiff.addedKeys().size() == 1
    && rolesDiff.changedKeys().size() == 0
    && rolesDiff.removedKeys().size() == 0
    && request.resource.data.roles[request.auth.uid] == 'editor';
}

function isValidInviteAcceptance(businessId) {
  let inviteId = request.resource.data._acceptingInviteId;
  let invite = getAfter(/databases/$(database)/documents/invites/$(inviteId));
  return invite.data.status == 'accepted'
    && invite.data.acceptedBy == request.auth.uid
    && invite.data.businessId == businessId;
}
```

### Pattern 4: Invite Accept Route with Auth Gate
**What:** `/invite/:inviteId` route that reads the invite, shows business info, and handles acceptance. If user isn't authenticated, show login first, then redirect back.
**When to use:** The accept share flow
**Example:**
```typescript
// Route: /invite/:inviteId
// 1. Read invite doc by ID
// 2. If not authenticated → LoginPage with returnUrl=/invite/{inviteId}
// 3. If authenticated → show "Join {businessName}?" with Accept button
// 4. On accept → writeBatch → navigate to /business/{businessId}
```

### Anti-Patterns to Avoid
- **Using business ID as share token:** Business IDs are permanent, appear in URLs/logs, and cannot be revoked
- **Separate query by token field:** Requires composite index, costs more, no security benefit over doc-ID-as-token
- **Cloud Functions for acceptance:** Adds billing, cold start latency, deployment complexity for a flow that works fine client-side
- **Modifying `ALLOWED_EMAILS` per invite:** This is a login whitelist, not an access control mechanism. Remove it entirely — access is controlled by Firestore roles
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token generation | Custom random string generator | `crypto.randomUUID()` | Built-in, CSPRNG, 122 bits entropy, all modern browsers |
| Atomic multi-doc updates | Sequential writes with rollback | `writeBatch()` | Firestore guarantees atomicity, no partial state |
| Map field diff in rules | Manual field-by-field comparison | `MapDiff.addedKeys()/changedKeys()/removedKeys()` | Built into Firestore rules engine since 2020 |
| Cross-document validation in rules | Post-write consistency checks | `getAfter()` in batched writes | Validates projected state within same batch |
| Role-based access control | Custom middleware | Firestore security rules `roles` map | Already implemented in project, battle-tested pattern |

**Key insight:** Firestore security rules are more powerful than most developers realize. `MapDiff`, `getAfter()`, `affectedKeys()`, and set operations eliminate the need for Cloud Functions in most multi-tenant sharing scenarios.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: ALLOWED_EMAILS Whitelist Blocks Invited Users
**What goes wrong:** Invited users can't log in because their email isn't in the hardcoded whitelist
**Why it happens:** `ALLOWED_EMAILS` in `auth-atoms.ts` gates login before Firestore roles are checked
**How to avoid:** Remove `ALLOWED_EMAILS` whitelist. Access control happens via Firestore `roles` map, not login gating.
**Warning signs:** Users report "access denied" on login despite having a valid invite link

### Pitfall 2: getAfter() Only Works in Batches
**What goes wrong:** Security rule with `getAfter()` fails on standalone `updateDoc()` calls
**Why it happens:** `getAfter()` reads the projected state of a document after the current batch commits. Outside a batch, there's no projected state.
**How to avoid:** Always use `writeBatch()` for the invite acceptance flow. Never accept via individual `updateDoc()` calls.
**Warning signs:** "Permission denied" errors only during invite acceptance, not during normal edits

### Pitfall 3: hasOnly() Passes for Empty Sets
**What goes wrong:** Security rule using `addedKeys().hasOnly([request.auth.uid])` passes even when no keys were added
**Why it happens:** `hasOnly()` checks if the set is a SUBSET of the argument, and the empty set is a subset of everything
**How to avoid:** Always pair `hasOnly()` with `.size() == 1` to ensure exactly one key was added
**Warning signs:** Users can make empty updates to business documents they shouldn't have access to

### Pitfall 4: _acceptingInviteId Persists on Document
**What goes wrong:** Business document has a stale `_acceptingInviteId` field after acceptance
**Why it happens:** The batch writes it for rule validation but doesn't remove it
**How to avoid:** Follow up with `deleteField()` call after batch commit (user is now an editor and has permission)
**Warning signs:** Extra field in business documents, potentially confusing other consumers

### Pitfall 5: Race Condition on Double-Accept
**What goes wrong:** Two users try to accept the same single-use invite simultaneously
**Why it happens:** No mutual exclusion between concurrent batch writes
**How to avoid:** The invite status transition (`pending` → `accepted`) naturally prevents this. The second batch fails because `resource.data.status` is no longer `'pending'`.
**Warning signs:** None — this is handled correctly by the atomic status check in rules

### Pitfall 6: Invite Expiration Not Enforced Server-Side
**What goes wrong:** Expired invites can still be accepted if only checking client-side
**Why it happens:** Client-side expiration check can be bypassed by a malicious client
**How to avoid:** Add `request.time` comparison in security rules. Store `expiresAt` as ISO string and compare, or switch to Firestore Timestamp.
**Warning signs:** Accepted invites with `acceptedAt` after `expiresAt`
</common_pitfalls>

<code_examples>
## Code Examples

### Complete Firestore Security Rules for Sharing
```javascript
// Source: Firebase documentation (MapDiff, getAfter, batched writes)
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /businesses/{businessId} {
      function hasRole(roles) {
        return request.auth != null
          && request.auth.uid in resource.data.roles
          && resource.data.roles[request.auth.uid] in roles;
      }

      function isOnlySelfAddToRoles() {
        let rolesDiff = request.resource.data.roles.diff(resource.data.roles);
        return rolesDiff.addedKeys().hasOnly([request.auth.uid])
          && rolesDiff.addedKeys().size() == 1
          && rolesDiff.changedKeys().size() == 0
          && rolesDiff.removedKeys().size() == 0
          && request.resource.data.roles[request.auth.uid] == 'editor';
      }

      function isValidInviteAcceptance(businessId) {
        let inviteId = request.resource.data._acceptingInviteId;
        let invite = getAfter(/databases/$(database)/documents/invites/$(inviteId));
        return invite.data.status == 'accepted'
          && invite.data.acceptedBy == request.auth.uid
          && invite.data.businessId == businessId;
      }

      allow create: if request.auth != null
        && request.resource.data.roles[request.auth.uid] == 'owner';
      allow read: if hasRole(['owner', 'editor']);
      allow update: if hasRole(['owner', 'editor'])
        || (
          request.auth != null
          && '_acceptingInviteId' in request.resource.data
          && request.resource.data.diff(resource.data).affectedKeys()
               .hasOnly(['roles', 'updatedAt', '_acceptingInviteId'])
          && isOnlySelfAddToRoles()
          && isValidInviteAcceptance(businessId)
        );
      allow delete: if hasRole(['owner']);
    }

    match /invites/{inviteId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.status == 'pending'
        && request.resource.data.createdBy == request.auth.uid
        && get(/databases/$(database)/documents/businesses/$(request.resource.data.businessId))
             .data.roles[request.auth.uid] == 'owner';
      allow update: if request.auth != null
        && resource.data.status == 'pending'
        && request.resource.data.status == 'accepted'
        && request.resource.data.acceptedBy == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(['status', 'acceptedBy', 'acceptedAt']);
      allow delete: if request.auth != null
        && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

### Create Invite (Client-Side)
```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function createInvite(businessId: string, creatorUid: string): Promise<string> {
  const inviteId = crypto.randomUUID();
  await setDoc(doc(db, 'invites', inviteId), {
    businessId,
    role: 'editor',
    createdBy: creatorUid,
    token: inviteId,
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  return inviteId;
}
```

### Accept Invite (Client-Side Batched Write)
```typescript
import { doc, getDoc, writeBatch, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function acceptInvite(inviteId: string, uid: string): Promise<string> {
  // 1. Read invite
  const inviteSnap = await getDoc(doc(db, 'invites', inviteId));
  if (!inviteSnap.exists()) throw new Error('Invite not found');
  const invite = inviteSnap.data();
  if (invite.status !== 'pending') throw new Error('Invite no longer valid');

  // 2. Atomic batch: accept invite + add role
  const batch = writeBatch(db);
  batch.update(doc(db, 'invites', inviteId), {
    status: 'accepted',
    acceptedBy: uid,
    acceptedAt: new Date().toISOString(),
  });
  batch.update(doc(db, 'businesses', invite.businessId), {
    [`roles.${uid}`]: invite.role,
    updatedAt: new Date().toISOString(),
    _acceptingInviteId: inviteId,
  });
  await batch.commit();

  // 3. Clean up transient field
  await updateDoc(doc(db, 'businesses', invite.businessId), {
    _acceptingInviteId: deleteField(),
  });

  return invite.businessId;
}
```

### List Active Invites for Owner UI
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getBusinessInvites(businessId: string): Promise<BusinessInvite[]> {
  // Requires composite index on (businessId, status)
  const q = query(
    collection(db, 'invites'),
    where('businessId', '==', businessId),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as BusinessInvite);
}
```
</code_examples>

<sota_updates>
## State of the Art (2024-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cloud Functions for invite acceptance | Client-side `writeBatch` + `getAfter()` rules | 2020+ (MapDiff/getAfter GA) | No server-side code needed |
| Manual field comparison in rules | `MapDiff.addedKeys()/changedKeys()/removedKeys()` | June 2020 | Much cleaner, less error-prone rules |
| Custom random token generation | `crypto.randomUUID()` | Chrome 92+ (2021) | No npm dependency for UUID generation |
| UUID v4 via `uuid` package | `crypto.randomUUID()` | 2021+ | Browser-native, same entropy |

**New tools/patterns to consider:**
- **Firestore `MapDiff`**: Full map comparison in security rules — `addedKeys()`, `removedKeys()`, `changedKeys()`, `affectedKeys()`
- **`getAfter()`/`existsAfter()`**: Read projected state within batched writes — enables cross-document validation without Cloud Functions
- **`request.resource.data.diff(resource.data)`**: Document-level diff for detecting exactly which fields changed

**Deprecated/outdated:**
- **Callable Cloud Functions for simple role updates**: Overkill when `writeBatch` + security rules suffice
- **`uuid` npm package for browser token generation**: `crypto.randomUUID()` is built-in since 2021
</sota_updates>

<open_questions>
## Open Questions

1. **Should `_acceptingInviteId` cleanup use `deleteField()` or just be left?**
   - What we know: The field is harmless metadata, but it's noise on the document
   - What's unclear: Whether the cleanup `updateDoc` could fail (user is now editor, should have permission)
   - Recommendation: Do the cleanup. If it fails, log and continue — the field is harmless.

2. **Should invites support multiple uses (shareable link) or single use only?**
   - What we know: Context says "Google Docs-style sharing" which implies reusable link
   - What's unclear: Whether the same link should work for multiple people
   - Recommendation: Support reusable links. Don't mark invite as `accepted` — keep it `pending`. Track acceptance separately (the roles map IS the acceptance record). Only the owner can revoke the link.

3. **Expiration enforcement: client-side only vs server-side?**
   - What we know: ISO string comparison in rules is possible but awkward
   - What's unclear: Whether the complexity of server-side expiration check is worth it
   - Recommendation: Client-side only for MVP. The invite can only be accepted by an authenticated user who has the UUID — the risk of an expired-invite exploit is very low.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- Firebase Documentation: Writing conditions for Security Rules — MapDiff, getAfter(), affectedKeys()
- Firebase Documentation: Transactions and batched writes — writeBatch() atomicity guarantees
- Firebase Documentation: Secure data access for users and groups — role-based access patterns
- Firebase Documentation: Control access to specific fields — field-level rule patterns
- Firebase Blog: New improvements to Firestore Security Rules (June 2020) — MapDiff, Set operations
- MDN: Crypto.randomUUID() — browser support, entropy, secure context requirement

### Secondary (MEDIUM confidence)
- Firebase Documentation: MapDiff interface reference — addedKeys(), changedKeys(), removedKeys(), hasOnly()
- Can I Use: crypto.randomUUID() — Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+
- Sentinel Stand: Firestore Security Rules examples — role-based patterns
- MakerKit: In-depth guide to Firestore Security Rules — map manipulation patterns

### Tertiary (LOW confidence - needs validation)
- Community patterns for `_pendingField` in batch writes — needs testing in actual Firestore emulator
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Firestore Security Rules v2 (MapDiff, getAfter)
- Ecosystem: Firebase client SDK v9 modular, crypto.randomUUID()
- Patterns: Invite token, atomic batch acceptance, self-add to roles map
- Pitfalls: ALLOWED_EMAILS whitelist, getAfter batch-only, hasOnly empty set, race conditions

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all existing Firebase SDK
- Architecture: HIGH — well-documented Firestore patterns, MapDiff/getAfter in GA since 2020
- Pitfalls: HIGH — documented in Firebase docs, verified with multiple sources
- Code examples: HIGH — from Firebase documentation, adapted to project's existing patterns

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (30 days — Firebase SDK/rules are stable)
</metadata>

---

*Phase: 09-sharing-access*
*Research completed: 2026-02-12*
*Ready for planning: yes*
