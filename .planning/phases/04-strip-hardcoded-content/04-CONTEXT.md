# Phase 4: Strip Hardcoded Content - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<vision>
## How This Should Work

Every trace of Fun Box — ocean parties, jellyfish museum, package names, crew roles, Miami-specific data — is completely gone from the codebase. When someone creates a new business, the experience is template-driven with AI-generated initial content: the user enters their business name, type, and description, and AI populates the sections with personalized starting content based on what they entered.

The scenario engine variables (pricing, leads, costs, etc.) stay in their current structure for now but with Fun Box-specific names and defaults stripped out. Phase 7 will make variables truly dynamic per business type; this phase just removes the hardcoded Fun Box values and replaces them with generic or empty defaults.

The constants file, section default data, system prompt, and all 9 section components should be clean of any business-specific content. When there's no data yet, the UI looks clean and inviting — not broken or empty — with good placeholder text and clear calls to action.

</vision>

<essential>
## What Must Be Nailed

- **Zero Fun Box traces** — Every hardcoded reference to Fun Box, ocean parties, jellyfish museum, specific packages, crew roles, Miami demographics, etc. must be completely gone. No business-specific content leaks into any view.
- **Sensible empty state** — When there's no data yet, the UI looks clean and inviting, not broken or empty. Good placeholder text, clear CTAs to start filling things in.
- **Flexible defaults system** — The architecture for how defaults work is solid. Easy to add new business types, each type gets appropriate section structure. The defaults system should be extensible for future types.

</essential>

<specifics>
## Specific Ideas

- AI-generated initial content on business creation: when the user creates a business with a name, type, and description, AI generates starting content for their enabled sections. This makes the first experience feel personalized, not generic.
- Scenario variables: strip Fun Box names but keep the same variable structure. Generic labels like "Price Tier 1", "Price Tier 2", "Monthly Leads", "Cost Per Unit" instead of "priceStarter", "priceVIP", "crewCount". Phase 7 will make these fully dynamic.
- The loading screen "F" logo, any Fun Box branding in the login page or export cover page — all gone.
- Section default data should be empty or have generic placeholder text, not Fun Box content.

</specifics>

<notes>
## Additional Context

This phase is a content cleanup + defaults architecture change. The scenario engine structure stays intact (same atoms, same derived metrics math) — only the variable names and default values change. The full generic scenario engine is Phase 7.

AI-generated initial content is an enhancement to the create-business flow (Phase 2). When a user creates a business, after Firestore creation, an AI call generates section content. This could be async (create business immediately, AI fills in the background) or blocking (show loading while AI generates).

The 12+ files that need cleaning include: constants.ts, system-prompt.ts, all 9 section component files, dashboard, login-page, PDF CoverPage, and derived-atoms.ts.

</notes>

---

*Phase: 04-strip-hardcoded-content*
*Context gathered: 2026-02-11*
