# Phase 21: Rich Growth Events - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<vision>
## How This Should Work

Keep the current simple Growth Timeline UX — same form, same flow. When a user clicks "Add Event", they see an expanded type dropdown with more business-relevant event types. Each type has its own set of fields, just like the current hire/cost-change/capacity-change types.

No compound events, no nested sub-events, no event catalogs. Just more types in the dropdown, each with smart fields tied to real financial calculations.

For duration-based events (facility build, hiring campaign), the user sets a start month + duration. The system handles spreading costs across the build period and delaying effects (e.g., capacity kicks in only after completion). One event entry, the compute engine does the math.

Same list of event types for all business types — no filtering or business-type awareness. The user knows their business and picks what's relevant.

</vision>

<essential>
## What Must Be Nailed

- **Breadth across all categories** — 2-3 event types per category (funding, operational, revenue, team, cost structure). Cover the major real-world business events, not just atomic cost/capacity changes.
- **Every event tied to real calculations** — each new event type must decompose into concrete financial impacts (cash flow, costs, revenue, capacity). No decorative events.
- **Duration support** — some events take time. Start month + duration parameter, with costs spread and effects delayed until completion. This is what makes the timeline a real planning tool.
- **Keep it simple** — same form pattern as today. No compound UIs, no wizard flows, no event catalogs. Just more types with more fields.

</essential>

<specifics>
## Specific Ideas

- Funding round: cash infusion amount, legal costs, investment type (equity/debt/grant)
- Facility build: construction/build-out cost, monthly rent after completion, capacity added, build duration
- Hiring campaign: number of hires, staggered over N months, recruiting cost per hire
- Price change: new price point from month N
- Equipment purchase: one-time cost, capacity increase, maintenance cost ongoing
- Seasonal campaign: marketing spend increase for N months only (temporary, reverts after)

</specifics>

<notes>
## Additional Context

Research identified 150+ business events across 8 categories. The approach is to pick the most impactful 2-3 per category for this phase, keeping the door open to add more later. The existing 5 atomic types (hire, cost-change, capacity-change, marketing-change, custom) remain — new types are additions, not replacements.

The compute engine should handle duration logic internally. Duration events expand into per-month effects during computation without changing the event data model significantly — just add optional `durationMonths` and `delayedEffects` fields.

</notes>

---

*Phase: 21-rich-growth-events*
*Context gathered: 2026-02-19*
