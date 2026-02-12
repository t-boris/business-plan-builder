# Phase 9: Sharing & Access - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<vision>
## How This Should Work

Sharing should be dead simple. The business owner clicks a "Share" button and gets a link. They send that link to whoever they want. The person opens the link, signs in (or creates an account if they don't have one), and the business immediately appears in their business list with full edit access. No confirmation steps, no preview gates, no permissions dialogs.

The owner should also be able to see who has access and revoke it. Think Google Docs sharing — a share button that copies a link, and a panel that shows who currently has access with the ability to remove them.

</vision>

<essential>
## What Must Be Nailed

- **Zero friction sharing** — One click to generate a link, one click (open link + sign in) to accept. No complex permissions or multi-step flows.
- **Owner control** — The owner can see who has access, revoke access, and regenerate/disable the share link.
- **Instant access** — When someone opens the share link and signs in, the business appears in their list immediately. No approval needed.

</essential>

<specifics>
## Specific Ideas

- Google Docs-style share pattern: share button, click to copy link, list of who has access
- Full edit access for everyone who joins (no viewer/editor distinction needed)
- Trust existing UI patterns for the share dialog/panel

</specifics>

<notes>
## Additional Context

The roadmap specifies this phase depends only on Phase 2 (Business CRUD), meaning it could have started earlier. The sharing model is simple: owner generates link, anyone with the link gets full access. No role hierarchy beyond owner vs shared user.

</notes>

---

*Phase: 09-sharing-access*
*Context gathered: 2026-02-12*
