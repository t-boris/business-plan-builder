# Phase 9: Sharing & Access - Context

**Gathered:** 2026-02-12
**Updated:** 2026-02-12
**Status:** Ready for planning

<vision>
## How This Should Work

Sharing should be dead simple. The business owner clicks a "Share" button and picks a role — editor or viewer. They get a link. They send that link to whoever they want. The person opens the link, signs in (or creates an account if they don't have one), and the business immediately appears in their business list with the assigned role. No confirmation steps, no preview gates.

The owner should also be able to see who has access and revoke it. Think Google Docs sharing — a share button that copies a link, and a panel that shows who currently has access with the ability to remove them.

Viewers can see everything (all sections, scenarios, exports) but can't change anything. Editors can do everything except manage sharing. Only the owner manages access.

</vision>

<essential>
## What Must Be Nailed

- **Zero friction sharing** — One click to generate a link (with role choice), one click (open link + sign in) to accept. No complex permissions or multi-step flows.
- **Owner control** — The owner can see who has access, revoke access, and regenerate/disable the share link. Revoke-only — no role changing after joining.
- **Instant access** — When someone opens the share link and signs in, the business appears in their list immediately. No approval needed.
- **Viewer/Editor distinction** — Share link determines the role. Viewers see everything, edit nothing.

</essential>

<specifics>
## Specific Ideas

- Google Docs-style share pattern: share button, pick role, click to copy link, list of who has access
- Owner picks "editor" or "viewer" when generating the share link — the link encodes the role
- Viewers get full read access to all sections, scenarios, and exports but cannot modify anything
- Owner can revoke access entirely but cannot change someone's role (revoke + re-invite if needed)
- Trust existing UI patterns for the share dialog/panel

</specifics>

<notes>
## Additional Context

The roadmap specifies this phase depends only on Phase 2 (Business CRUD), meaning it could have started earlier. The sharing model has two roles beyond owner: editor (full access) and viewer (read-only). The owner is the only one who can manage sharing. Role changing is not supported — only revoke and re-invite.

Updated from original context to add viewer/editor role distinction (originally was editor-only).

</notes>

---

*Phase: 09-sharing-access*
*Context gathered: 2026-02-12*
