# Phase 10: Dashboard & Navigation - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<vision>
## How This Should Work

When you open a business, the dashboard is the landing page. It should immediately show you the key numbers — KPI cards with the most important computed variables from your scenario engine (revenue, costs, profit margin, etc.), automatically chosen based on what the business has configured. No manual setup needed.

Below the KPIs, charts show monthly projections and trends from the active scenario. The dashboard should feel like a real business overview — not a placeholder page, but the place you go to quickly check how the numbers look.

The sidebar navigation is already in good shape — it filters by enabled sections and has the business switcher. No major changes needed there, just make sure everything works well with the current setup.

</vision>

<essential>
## What Must Be Nailed

- **Smart KPI cards** — Automatically surface the most meaningful computed variables as dashboard cards. Revenue, costs, margins — whatever the business's variable library produces. No manual configuration.
- **Relevant charts** — Monthly projections and scenario data visualized in charts that reflect the actual variables the business has. Not generic placeholder charts.
- **Complete and useful** — The dashboard should feel like a finished product, not a skeleton. KPIs and charts together give you a real at-a-glance business overview.

</essential>

<specifics>
## Specific Ideas

- KPI cards driven by top computed variables from the scenario engine
- Charts showing monthly projection trends (12-month view from active scenario)
- Dashboard adapts to whatever variables exist — SaaS business shows MRR/churn, restaurant shows covers/food cost, etc.
- No need for user-customizable card layout — just smart defaults

</specifics>

<notes>
## Additional Context

The current dashboard already exists with some hardcoded-then-genericized KPI logic from Phase 7 (first 4/next 4 computed vars as primary/secondary KPIs). This phase is about making it genuinely useful and polished for any business type. The sidebar navigation is already functional and doesn't need rework — just verify it works correctly with all the Phase 5-9 changes.

</notes>

---

*Phase: 10-dashboard-navigation*
*Context gathered: 2026-02-12*
