# Phase 8: Business-Aware AI - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<vision>
## How This Should Work

The AI should feel like talking to a knowledgeable business advisor who already knows everything about your business. When you're working on a SaaS business, the AI feels like a SaaS consultant. When you're working on a restaurant, it feels like a restaurant industry expert.

Both sides of the AI adapt to the business:
1. **The prompts themselves change** — a restaurant market analysis focuses on local foot traffic and competition radius, while a SaaS market analysis focuses on TAM/SAM and competitive landscape. The questions and guidance are fundamentally different per business type.
2. **The generated content is deeply contextual** — the AI references actual numbers from variables and scenarios (not generic placeholders like "your revenue" but real values like "$50k/mo" or "200 monthly leads"), knows the business location, industry, and type.

Zero manual context-setting. The user never has to explain their business to the AI — it already knows everything from the business profile, variable definitions, and active scenario data. It should just work.

</vision>

<essential>
## What Must Be Nailed

- **Uses actual numbers** — AI references real variable values and scenario data, not generic placeholders. If monthly revenue is $50k, the AI says "$50k" not "your revenue."
- **Deep business-type awareness** — The AI's personality and focus areas shift based on business type. A restaurant AI thinks about food costs and table turnover. A SaaS AI thinks about MRR and churn.
- **No manual context-setting** — Everything the AI needs comes from the existing business profile, variables, and scenarios. The user does nothing extra.

</essential>

<specifics>
## Specific Ideas

- Keep the existing Gemini integration — use Gemini 3.0 Preview as the model
- Make the prompts smarter, not the UI — the current AI suggestion UI pattern works fine
- No specific UI preferences — trust the existing implementation patterns

</specifics>

<notes>
## Additional Context

The existing codebase already has Gemini integration with section-specific prompts and a system prompt. Phase 8 is about making these prompts dynamic based on business context, not rebuilding the AI infrastructure. The key shift: from static prompts to prompts that are constructed at runtime from the business profile, active variables, and scenario data.

User explicitly wants Gemini 3.0 Preview as the model version.

</notes>

---

*Phase: 08-business-aware-ai*
*Context gathered: 2026-02-12*
