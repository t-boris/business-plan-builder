# Phase 5: Business Profile & Section Config - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<vision>
## How This Should Work

Everything feels lightweight and inline — no dedicated settings pages or heavy wizards. Business profile editing and section configuration live together in a compact header bar that appears on every page.

The header bar is minimal when collapsed: just the business name and an expand button. Click to expand, and you can edit all profile details inline plus toggle sections on/off. It's always accessible but never in the way.

When you edit profile fields (name, type/industry, location, description), it saves immediately — no submit buttons, just inline editing. Section toggles are simple switches. Turn off "Launch Plan" if your business doesn't need it, and it disappears from the sidebar navigation. Turn it back on, and all your data is still there.

The whole thing should feel like you're configuring a workspace, not filling out a form. Quick, lightweight, reversible.

</vision>

<essential>
## What Must Be Nailed

- **Business identity** — Name, type/industry, location, and short description. These are the basics that drive AI generation and the whole experience. Keep it minimal — no logo, no branding, no financial metadata.
- **Section flexibility** — Toggle any of the 9 sections on/off per business. Not every business needs all sections. Data is preserved when toggling off (hide UI, keep data in Firestore). Toggling back on restores everything.
- **Both are equally important** — Profile and section config are two sides of the same coin. One without the other doesn't deliver value.

</essential>

<specifics>
## Specific Ideas

- Compact header bar on every page, not just the dashboard. Collapsed state shows only business name + expand button. Expanded state shows editable profile fields + section toggle switches.
- Sections have a fixed order (not customizable). The 9 sections always appear in the same logical order in the sidebar — simpler and more consistent.
- No confirmation dialogs when toggling sections off — it's just a toggle, and data is preserved. Make it feel safe and reversible.
- Profile fields: name, type/industry, location, short description. That's it — basics only.

</specifics>

<notes>
## Additional Context

The user strongly favors inline, lightweight interactions over dedicated pages or modals. The header bar pattern keeps business context visible everywhere without cluttering individual section pages.

This phase is important for making the app feel truly multi-business — each business has its own identity and its own set of enabled sections. The profile data will later drive AI generation (Phase 8) and export (Phase 11).

</notes>

---

*Phase: 05-business-profile-section-config*
*Context gathered: 2026-02-11*
