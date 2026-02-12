# Phase 6: Variable Library - Context

**Gathered:** 2026-02-11
**Status:** Ready for research

<vision>
## How This Should Work

Each business type comes with a pre-built set of variables that auto-populate when you create a business. A SaaS business gets MRR, churn rate, CAC. A restaurant gets covers per day, average check, food cost percentage. The right variables for the right business — smart defaults that make the scenario engine immediately useful.

Variables are fully editable after creation — templates are just a starting point. Users can rename, add, remove, and redefine any variable. If the template doesn't fit perfectly, they adjust it. No locked structures.

Some variables are inputs (price, monthly leads, staff count) and some are computed (revenue, profit, break-even). Users see them together — they appear as one coherent set of business numbers — but the system treats them differently. Input variables are just numbers you type in. Computed variables have formulas that reference other variables and auto-update when inputs change. Like a lightweight spreadsheet but scoped to business planning.

The variable management lives on the Scenarios page, alongside the scenario controls where variables are actually used. It's not a separate page — it's part of the scenario workflow.

</vision>

<essential>
## What Must Be Nailed

- **Smart defaults per business type** — All 7 existing types (SaaS, Service, Retail, Restaurant, Event, Manufacturing, Custom) need curated variable sets. The right variables should feel obvious and immediately useful for that business type.
- **Scenario engine foundation** — Variables must work as inputs to derived metrics. The math has to be correct and composable. Change price, revenue auto-updates. Change staff count, costs recalculate.
- **Easy to understand** — Non-technical business owners should immediately understand what each variable means and how to use it. Clear names, descriptions, units.
- **All three are equally important** — this is the core of the financial modeling engine.

</essential>

<specifics>
## Specific Ideas

- Template-driven: when a business is created with a type (SaaS, Retail, etc.), its variable set auto-populates from the template. These become the business's active variables.
- Fully editable: users can rename variables, change formulas, add custom variables, remove ones they don't need. Templates are starting points, not constraints.
- Two kinds of variables: input variables (user types a number) and computed variables (formula references other variables, auto-calculates). Users see both together.
- Variable management on the Scenarios page — integrated into the scenario workflow, not a separate config area.
- All 7 business types should have variable templates at launch — no partial coverage.
- Research needed: figure out which variables make sense for each business type. Trust builder judgment on the specifics.

</specifics>

<notes>
## Additional Context

This phase is the foundation for Phase 7 (Generic Scenario Engine). The variable library defines WHAT can be modeled; Phase 7 makes the scenario engine dynamic to USE those variables. The current hardcoded scenario variables (priceTier1/2/3, staffCount, costPerUnit, monthlyLeads, etc.) will eventually be replaced by business-specific variables from this library.

The roadmap flagged this phase as "Research: Likely" — need to define meaningful variable sets for different business types, understand revenue driver categories, and cost structure patterns across industries.

</notes>

---

*Phase: 06-variable-library*
*Context gathered: 2026-02-11*
