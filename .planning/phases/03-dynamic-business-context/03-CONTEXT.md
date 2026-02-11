# Phase 3: Dynamic Business Context - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<vision>
## How This Should Work

Every page in the app lives under a business context via URL: `/business/:id/market-analysis`, `/business/:id/scenarios`, etc. When you select a business from the list or sidebar, the URL updates and all data (sections, scenarios, financials) loads for that specific business. It should feel like each business is its own self-contained app.

On fresh app open, the last-used business (from localStorage) auto-opens — you land right where you left off. If the stored business no longer exists or you have none, you go to the business list.

Switching businesses from the sidebar dropdown navigates to the new business's dashboard (`/business/:newId`). Browser back/forward works naturally — full history of business switches and section navigation is preserved.

The sidebar shows only the sections that business has enabled (from its template), not the full hardcoded list. The layout shell (sidebar + header) renders immediately while section data loads via individual skeletons — no full-page loading screen.

Old routes without business ID (`/market-analysis`, `/scenarios`) are removed completely — clean break, no legacy paths. If someone navigates to a business that doesn't exist or they lack access, they see a clear error page with a link back to the business list.

</vision>

<essential>
## What Must Be Nailed

- **Data isolation** — Each business's sections and scenarios are completely separate. No data leaking between businesses.
- **Shareable URLs** — `/business/xyz/financial-projections` always works, can be bookmarked and shared.
- **Seamless switching** — Switch from sidebar dropdown, land on new business's dashboard, fresh data loads from Firestore.
- **Dynamic sidebar** — Only show sections enabled for the current business, not the full hardcoded list.
- **Shell-first loading** — Sidebar and layout render immediately; section content loads with individual skeletons.

</essential>

<specifics>
## Specific Ideas

- URL structure: `/business/:id/section-name` (readable prefix, not abbreviated)
- Business switch → always navigate to `/business/:newId` (dashboard), not stay on current section
- Fresh Firestore load on every business switch (no in-memory caching across businesses)
- Last-used business auto-restored from localStorage on app open
- Old routes (`/market-analysis` etc.) removed entirely — 404, no redirects
- Invalid business ID → dedicated error page ("Business not found" / "Access denied") with link back
- Browser back/forward preserves full navigation history across business switches

</specifics>

<notes>
## Additional Context

This phase transforms the app from "one hardcoded plan" to "URL-driven multi-business." The sidebar's section list becoming dynamic (only enabled sections) is part of this phase's vision — not deferred to Phase 5. Phase 5 is about the UI to *configure* which sections are enabled; this phase makes the sidebar *respect* that configuration.

Scenario data should reload fresh from Firestore each time a business is selected — no cross-business memory caching. Keep it simple and correct first.

</notes>

---

*Phase: 03-dynamic-business-context*
*Context gathered: 2026-02-11*
