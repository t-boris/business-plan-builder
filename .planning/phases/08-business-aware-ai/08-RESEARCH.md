# Phase 8: Business-Aware AI - Research

**Researched:** 2026-02-12
**Domain:** Dynamic AI prompts, Gemini 3 API, context-aware business content generation

## 1. Current Codebase State

### Existing AI Architecture (5 files in `src/lib/ai/`)

| File | Purpose | Phase 8 Impact |
|------|---------|----------------|
| `gemini-client.ts` | SDK wrapper, `generateSectionContent()` + `generateStructuredContent<T>()` | Update MODEL constant only |
| `system-prompt.ts` | Static `SYSTEM_INSTRUCTION` string | **Replace with dynamic builder** |
| `context-builder.ts` | XML-tagged prompt assembly (`buildPrompt()`, `buildScenarioContext()`) | **Evolve to accept BusinessProfile** |
| `section-prompts.ts` | Per-section prompts + Zod schemas, `getSectionPrompt(slug, action)` | **Add industry overlays** |
| `perplexity-client.ts` | Market research via Perplexity API | No changes needed |

### Key Integration Points

- `gemini-client.ts` already uses `@google/genai` SDK with `config.systemInstruction` and `temperature: 1.0`
- `context-builder.ts` has placeholder: `buildBusinessOverview()` returns `"[Not configured -- business profile will be set in Phase 8]"`
- `buildPrompt()` accepts `scenarioMetrics: Record<string, number>` (from Phase 7's `evaluatedValuesAtom`)
- `getSectionPrompt(slug, action)` currently ignores business type — returns same prompt for all businesses
- Zod schemas in `section-prompts.ts` are still hardcoded to Fun Box structure (packages, crew, museum tickets, etc.)

### Data Available at Runtime

From Phase 5 (BusinessProfile):
- `name`, `type` (BusinessType: saas|service|retail|restaurant|event|manufacturing|custom), `industry`, `location`, `description`, `currency`

From Phase 7 (Dynamic Variables):
- `businessVariablesAtom`: `Record<string, VariableDefinition>` with id, label, type, category, unit, value, formula
- `evaluatedValuesAtom`: `Record<string, number>` — all computed values ready to inject
- `scenarioValuesAtom`: `Record<string, number>` — current scenario input overrides

From existing sections:
- Section data loaded via `useSection(slug)` — arbitrary `Record<string, unknown>` per section

## 2. Gemini 3 API

### Model Identification

Gemini 3 dropped the ".0" from naming:

| Model | Model ID | Input Tokens | Output Tokens | Price (per 1M) |
|-------|----------|-------------|--------------|----------------|
| Gemini 3 Flash | `gemini-3-flash-preview` | 1M | 64K | $0.50 / $3 |
| Gemini 3 Pro | `gemini-3-pro-preview` | 1M | 64K | $2 / $12 |

### SDK Compatibility

The project already uses `@google/genai` (correct new SDK, not the deprecated `@google/generative-ai`). Current version `^1.40.0` is compatible — latest is `1.41.0`.

**Migration is trivial: change `const MODEL = 'gemini-2.5-flash'` to `'gemini-3-flash-preview'`.**

### API Surface — What Changed

Unchanged (our code already does this correctly):
- `ai.models.generateContent()` — same method signature
- `config.systemInstruction` — same parameter
- `config.responseMimeType` / `config.responseSchema` — same structured output
- `config.temperature: 1.0` — correct (Gemini 3 requires ≥1.0)
- `config.maxOutputTokens` — same parameter

New in Gemini 3:
- `config.thinkingConfig.thinkingLevel`: Controls reasoning depth: `'low'` | `'medium'` | `'high'` (default). Can be used per-request to optimize speed vs quality.
- Dynamic thinking is on by default — no need for "think step by step" in prompts
- Gemini 3 is less verbose by default — prompts should explicitly request detail when needed

### Recommendation

Use `gemini-3-flash-preview` for cost efficiency ($0.50/1M input vs $2/1M for Pro). The Flash model handles structured business content well. Add `thinkingLevel: 'low'` for simple formatting tasks, leave default `'high'` for analytical sections.

## 3. Dynamic Prompt Architecture

### Pattern: Three-Layer Prompt Assembly

```
Layer 1: System Prompt (STABLE per business type — cacheable)
  ├── Role definition (varies by BusinessType)
  ├── Tone & constraints (mostly static)
  ├── Output format rules (static)
  └── Domain vocabulary (varies by BusinessType)

Layer 2: User Message Context (SEMI-STABLE — changes per section)
  ├── <business_profile> ... </business_profile>
  ├── <scenario_metrics> ... </scenario_metrics>
  ├── <current_section> ... </current_section>
  └── <related_sections> ... </related_sections>  (optional)

Layer 3: Task Instruction (DYNAMIC — changes per request)
  ├── Base section prompt
  ├── Industry overlay (appended)
  ├── User's free-text instruction (optional)
  └── Action type (generate / improve / expand)
```

### Why Three Layers

- **Layer 1 in systemInstruction**: Gemini caches system instructions across requests. Keeping the role/tone/constraints here means repeated requests for the same business type get cache hits.
- **Layer 2 in user message**: Business profile and scenario data change per business/section. Structured with XML tags (existing pattern — Gemini handles XML tags well).
- **Layer 3 at end of user message**: Task-specific instructions come last per Gemini 3's recommendation ("put constraints and quantitative limits last").

## 4. Dynamic System Prompt Builder

### Replace Static `SYSTEM_INSTRUCTION`

Current: Single static string in `system-prompt.ts` with generic "business plan writer" role.

Target: `buildSystemPrompt(profile: BusinessProfile)` that returns a type-specific expert prompt.

### Industry Role Map

Each BusinessType gets a fundamentally different expert persona:

| BusinessType | Role |
|-------------|------|
| saas | SaaS business strategist — recurring revenue, churn, PLG |
| restaurant | Restaurant industry consultant — food service, location, hospitality |
| retail | Retail business advisor — inventory, foot traffic, omnichannel |
| service | Service business consultant — capacity, acquisition, delivery |
| event | Event business strategist — seasonal demand, venue logistics, experiential |
| manufacturing | Manufacturing consultant — supply chain, production, quality |
| custom | General business plan writer (current behavior) |

### Industry Vocabulary Injection

Include domain-specific terminology in system prompt so the AI uses correct jargon:

- **SaaS**: MRR, ARR, churn, NRR, LTV:CAC, expansion revenue, PLG, seats
- **Restaurant**: covers, ticket average, food cost %, labor cost %, table turns, RevPASH, prime cost
- **Retail**: SKU, sell-through rate, GMROI, shrinkage, planogram, basket size, ATV
- **Service**: utilization rate, billable hours, client retention, service delivery SLA
- **Event**: per-event cost, capacity utilization, seasonal demand curve, booking lead time
- **Manufacturing**: BOM, COGS, yield rate, OEE, lead time, WIP, safety stock

### System Prompt Structure

```
ROLE: {industry-specific role}

BUSINESS CONTEXT:
Name: {profile.name}
Type: {profile.type}
Industry: {profile.industry}
Location: {profile.location}
Description: {profile.description}

DOMAIN EXPERTISE:
Use industry-standard terminology: {vocabulary list}

TONE:
- Professional but approachable
- Data-driven: reference specific numbers from the provided metrics
- Concise: use bullet points and short paragraphs
- Actionable: every recommendation should be implementable

CONSTRAINTS:
- Never invent financial numbers. Use ONLY the data provided in scenario metrics.
- When data is missing, explicitly say "Data needed:" followed by what is required.
- All monetary values in {profile.currency}.
- Reference actual values (e.g., "$50k/mo" not "your revenue").

OUTPUT FORMAT:
- Return structured JSON matching the provided schema when a schema is specified.
- Use markdown formatting within text fields.
- Keep individual text fields under 500 words unless asked to expand.
```

## 5. Section Prompt Adaptation

### Pattern: Base + Industry Overlay

Instead of duplicating all prompts per business type (maintenance nightmare), use a base prompt + overlay:

```
Base prompt (existing generic prompt)
+
Industry overlay (appended only when BusinessType !== 'custom')
```

The overlay appends industry-specific focus areas. When you improve a base prompt, all business types benefit.

### Industry Overlays Per Section

**Market Analysis:**
- SaaS: TAM/SAM/SOM bottom-up, feature comparison matrix, technology adoption lifecycle, switching costs
- Restaurant: Foot traffic, anchor tenants, delivery radius, cuisine overlap, Yelp/Google ratings
- Retail: Trade area analysis, anchor proximity, online-to-offline conversion, seasonal demand curves
- Manufacturing: Supply chain geography, raw material sourcing, trade regulations, capacity utilization benchmarks

**Operations:**
- SaaS: Engineering team, sprint velocity, cloud infrastructure tiers, customer support ratios, deployment pipeline
- Restaurant: Kitchen stations, FOH/BOH staffing by shift, food cost % targets (28-32%), prep schedules, vendor relationships
- Retail: Store layout, inventory management, POS systems, loss prevention, seasonal staffing
- Manufacturing: Production line layout, shift scheduling, quality control checkpoints, equipment maintenance schedules

**Financial Projections:**
- SaaS: MRR/ARR growth, churn rate (logo + revenue), LTV:CAC ratio, months to payback, net revenue retention
- Restaurant: Food cost ratio, labor cost ratio, prime cost, RevPASH, seasonal cover variations
- Retail: Inventory turnover, GMROI, markdown strategy, seasonal revenue patterns
- Manufacturing: Unit COGS, yield rate, capacity utilization impact, raw material cost sensitivity

**Marketing Strategy:**
- SaaS: Content marketing, product-led acquisition, free trial conversion, developer relations
- Restaurant: Local SEO, delivery platform presence, review management, loyalty programs
- Retail: Foot traffic drivers, seasonal promotions, loyalty programs, omnichannel attribution
- Manufacturing: Trade shows, B2B sales cycle, distributor relationships, technical documentation

### Remaining Sections

Executive summary, product/service, risks, KPIs, and launch plan can use base prompts — their structure is largely business-type-agnostic. The system prompt's role/vocabulary already provides sufficient context.

## 6. Context Injection Improvements

### Current State

`buildPrompt()` assembles:
```xml
<business_context>
  [hardcoded placeholder]
  SCENARIO METRICS: key: value, key: value, ...
</business_context>
<current_section>
  [JSON dump of section data]
</current_section>
<task>
  [section prompt]
</task>
```

### Target State

```xml
<business_profile>
  Name: {name}
  Type: {type}
  Industry: {industry}
  Location: {location}
  Description: {description}
</business_profile>
<scenario_metrics>
  These are ACTUAL calculated values. Use these exact numbers:
  - Monthly Revenue: $50,000
  - Monthly Costs: $32,000
  - Profit Margin: 36%
  ...
</scenario_metrics>
<current_section slug="{slug}">
  {section data}
</current_section>
<task>
  {base prompt + industry overlay}
  {user instruction if any}
</task>
```

### Key Improvements

1. **Replace placeholder** with actual `BusinessProfile` data — `buildBusinessOverview()` → `buildBusinessProfile(profile)`
2. **Format scenario metrics with units** — Use variable definitions to format: currency → `$50,000`, percent → `36%`, count → `200`
3. **Add "use exact numbers" guardrail** — Prefix scenario metrics with explicit instruction to use actual values
4. **Pass `businessType` to `getSectionPrompt()`** — New signature: `getSectionPrompt(slug, action, businessType)`

## 7. File Organization

### Changes to Existing Files

| File | Change |
|------|--------|
| `system-prompt.ts` | Replace `SYSTEM_INSTRUCTION` constant with `buildSystemPrompt(profile)` function |
| `context-builder.ts` | Add `BusinessProfile` parameter to `buildPrompt()`, replace `buildBusinessOverview()`, format metrics with units |
| `section-prompts.ts` | Add `INDUSTRY_OVERLAYS` map, update `getSectionPrompt()` to accept `businessType` |
| `gemini-client.ts` | Change `MODEL` to `'gemini-3-flash-preview'`, optionally add `thinkingLevel` config |

### New File

| File | Purpose |
|------|---------|
| `industry-config.ts` | Single source of truth: role descriptions, vocabulary, focus areas per BusinessType |

### Consumers to Update

The `useSection` hook (or whatever calls `buildPrompt` + `generateSectionContent`) needs to pass `BusinessProfile` and the business-aware system prompt. Check how sections currently trigger AI:

- Each section component likely calls a hook or function that uses `buildPrompt()` and `SYSTEM_INSTRUCTION`
- These call sites need to read `BusinessProfile` from the active business and pass it through

## 8. What NOT to Build

- **No new UI** — The existing AI suggestion UI pattern works fine (per CONTEXT.md)
- **No prompt management system** — Hardcoded overlays in `industry-config.ts` are sufficient
- **No prompt versioning** — Not needed at this stage
- **No cross-section context injection** — Nice-to-have but not in scope for Phase 8 (executive summary referencing financial data). Can be added in Phase 12.
- **No streaming** — Current non-streaming approach works fine
- **No model selection UI** — Use `gemini-3-flash-preview` for all requests
- **No Zod schema changes** — The structured output schemas are section-specific, not business-type-specific. They stay as-is. (Some schemas like `CostBreakdownSchema` have Fun Box artifacts but that's a Phase 12 polish item.)

## 9. Implementation Approach

### Plan 08-01: Dynamic System Prompt Builder

1. Create `industry-config.ts` with `IndustryConfig` per BusinessType (role, vocabulary, focus areas)
2. Replace `system-prompt.ts` static constant with `buildSystemPrompt(profile: BusinessProfile)` function
3. Update `context-builder.ts`:
   - `buildPrompt()` accepts `BusinessProfile` parameter
   - `buildBusinessOverview()` → `buildBusinessProfile(profile)` using actual profile data
   - `buildScenarioContext()` formats values with units using variable definitions
4. Update `gemini-client.ts`: change MODEL to `gemini-3-flash-preview`
5. Update all consumers to pass `BusinessProfile` and dynamic system prompt

### Plan 08-02: Section Prompt Adaptation

1. Add `INDUSTRY_OVERLAYS` to `section-prompts.ts` — industry-specific focus areas for market-analysis, operations, financial-projections, marketing-strategy
2. Update `getSectionPrompt(slug, action, businessType)` to merge base + overlay
3. Update call sites in `context-builder.ts` to pass `businessType`
4. Verify end-to-end: different business types → different prompts → different AI output

## 10. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Gemini 3 Preview model unavailable/deprecated | Low | Fall back to `gemini-2.5-flash` — same SDK |
| Industry overlays too generic | Medium | Start with 4 key sections, iterate based on actual usage |
| Token budget with rich context | Low | 1M token input limit is more than sufficient; business profile + metrics is ~200 tokens |
| Breaking existing AI functionality | Medium | Additive approach: `buildSystemPrompt()` falls back to current behavior for `custom` type |

---

*Phase: 08-business-aware-ai*
*Research completed: 2026-02-12*
