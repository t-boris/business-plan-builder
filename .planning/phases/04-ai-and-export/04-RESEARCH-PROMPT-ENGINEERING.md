# Phase 4: AI Assistance - Prompt Engineering Research

**Researched:** 2026-02-11
**Domain:** Gemini 2.5 Pro prompt engineering for per-section business plan AI assistance
**Confidence:** HIGH

<research_summary>
## Summary

Researched prompt engineering patterns for integrating Gemini 2.5 Pro as a per-section "Ask AI" assistant in the Fun Box Planning app. The architecture uses a **context engineering** approach: each AI request sends a system prompt (business writing persona), the full business context as a compressed summary, and section-specific data as the primary focus. Gemini's `system_instruction` parameter sets the tone, `responseMimeType: "application/json"` with `responseJsonSchema` (via Zod) ensures structured output, and streaming via `generateContentStream` provides real-time typewriter display.

Key finding: **Context engineering > prompt engineering** (Gartner 2025). Rather than crafting clever prompts, the quality of AI output depends on what data you put in the context window. For this app, that means serializing Jotai atom values into a structured context block that gives the model full business awareness while focusing on one section.

**Primary recommendation:** System prompt (persona + tone) + full business context summary (compressed) + target section data (full detail) + section-specific generation instructions. Use Zod schemas for structured output. Stream responses with `generateContentStream`. Display with accept/reject/edit inline workflow.
</research_summary>

---

## 1. Per-Section Contextual Prompting

### 1.1 Context Engineering Architecture

The modern approach (2025-2026) is **context engineering**, not just prompt engineering. Context engineering is the systematic optimization of the information payload sent to the LLM -- curating, filtering, and ordering data so the model has exactly the right background to perform reliably.

**Core principle:** The model does not use its context uniformly. Performance degrades as input length grows past what is relevant. Adding more context does not always improve answers -- past a point, it actively degrades performance.

**Architecture for this app:**

```
[System Instruction]     -- Persona, tone, constraints (stays constant)
[Business Context Block] -- Compressed summary of ALL sections (varies per plan)
[Target Section Data]    -- Full detail of the section being edited (varies per request)
[Generation Instruction] -- What to do: generate, improve, expand, etc.
```

Sources:
- [Context Engineering: The Definitive 2025 Guide](https://www.flowhunt.io/blog/context-engineering/)
- [Context Engineering Guide - Prompt Engineering Guide](https://www.promptingguide.ai/guides/context-engineering-guide)
- [Context Limits and Their Impact - CodeSignal](https://codesignal.com/learn/courses/understanding-llms-and-basic-prompting-techniques/lessons/context-limits-and-their-impact-on-prompt-engineering)

### 1.2 System Prompt for Consistent Business Writing Tone

Use Gemini's `system_instruction` parameter to set a persistent persona. This is processed before all user messages and takes priority over prompt-level instructions.

```typescript
const SYSTEM_INSTRUCTION = `You are a business plan writing assistant for "Fun Box," a premium mobile kids birthday party service in Miami.

ROLE: Expert business plan writer with knowledge of Miami's entertainment and events market.

TONE:
- Professional but approachable -- this is for a solo entrepreneur, not a corporate board
- Data-driven: always reference specific numbers when available
- Concise: use bullet points and short paragraphs, not walls of text
- Actionable: every recommendation should be implementable

CONSTRAINTS:
- Never invent financial numbers. Use only the data provided in the business context.
- When data is missing, explicitly say "Data needed:" followed by what is required.
- All monetary values in USD.
- Target audience context: Miami metro, parents 28-50, bilingual market (75.3% non-English speakers).
- Always consider the 3 packages: Ocean Starter ($800), Ocean Explorer ($980), Ocean VIP ($1,200).

OUTPUT FORMAT:
- Return structured JSON matching the provided schema.
- Use markdown formatting within text fields (bold, bullets, headers).
- Keep individual text fields under 500 words unless specifically asked to expand.`;
```

**Why `system_instruction` and not a user message prefix:** Gemini treats system instructions with higher priority. They persist across conversation turns and do not count against the "user message" portion of the context window in the same way.

Sources:
- [Gemini API Prompting Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [Gemini 2.5 Pro API Guide - DataCamp](https://www.datacamp.com/tutorial/gemini-2-5-pro-api)

### 1.3 Full Business Context While Focusing on One Section

**Pattern: Layered Context with Priority Ordering**

Place the most important information earliest in the context window. Structure in three layers:

**Layer 1 -- Business Overview (always included, ~200-300 tokens):**
```
BUSINESS: Fun Box -- premium mobile kids birthday party service, Miami FL
PACKAGES: Ocean Starter $800 (15 pax), Ocean Explorer $980 (15 pax), Ocean VIP $1,200 (15 pax)
TARGETS: 100-150 leads/month, 15-25% conversion, $10-30 CAC/lead
LAUNCH: March 2026
MARKET: Miami-Dade, 15-25 mile radius, parents 28-50
```

**Layer 2 -- Cross-Section Summary (dynamically built, ~500-800 tokens):**
Serialize relevant data from other sections as a compressed summary. This is built at request time from Jotai atom values.

```typescript
function buildCrossSectionContext(
  sections: Map<SectionSlug, BusinessPlanSection | null>,
  excludeSlug: SectionSlug
): string {
  const parts: string[] = [];

  // Always include financial metrics if available
  const financial = sections.get('financial-projections');
  if (financial && excludeSlug !== 'financial-projections') {
    parts.push(`FINANCIALS: Avg check $${financial.unitEconomics.avgCheck}, ` +
      `cost/event $${financial.unitEconomics.costPerEvent}, ` +
      `profit/event $${financial.unitEconomics.profitPerEvent}`);
  }

  // Include marketing channels summary
  const marketing = sections.get('marketing-strategy');
  if (marketing && excludeSlug !== 'marketing-strategy') {
    const totalBudget = marketing.channels.reduce((s, c) => s + c.budget, 0);
    parts.push(`MARKETING: $${totalBudget}/mo across ${marketing.channels.length} channels`);
  }

  // Include operations summary
  const ops = sections.get('operations');
  if (ops && excludeSlug !== 'operations') {
    parts.push(`OPERATIONS: ${ops.crew.length} crew roles, ` +
      `max ${ops.capacity.maxBookingsPerMonth} bookings/mo, ` +
      `${ops.travelRadius} mi radius`);
  }

  // Include KPI targets
  const kpis = sections.get('kpis-metrics');
  if (kpis && excludeSlug !== 'kpis-metrics') {
    parts.push(`KPIs: ${kpis.targets.monthlyLeads} leads/mo, ` +
      `${(kpis.targets.conversionRate * 100).toFixed(0)}% conversion, ` +
      `$${kpis.targets.avgCheck} avg check`);
  }

  // Include risk flags
  const risks = sections.get('risks-due-diligence');
  if (risks && excludeSlug !== 'risks-due-diligence') {
    const highRisks = risks.risks.filter(r => r.severity === 'high');
    if (highRisks.length > 0) {
      parts.push(`HIGH RISKS: ${highRisks.map(r => r.title).join(', ')}`);
    }
  }

  return parts.join('\n');
}
```

**Layer 3 -- Target Section Data (full detail, variable tokens):**
The section being edited is included in full JSON detail.

```typescript
function buildTargetSectionContext(
  slug: SectionSlug,
  data: BusinessPlanSection | null
): string {
  if (!data) {
    return `CURRENT SECTION (${slug}): Empty -- no data entered yet.`;
  }
  return `CURRENT SECTION (${slug}):\n${JSON.stringify(data, null, 2)}`;
}
```

### 1.4 Prompt Assembly Pattern

```typescript
interface AiRequestConfig {
  sectionSlug: SectionSlug;
  action: 'generate' | 'improve' | 'expand' | 'summarize';
  userInstruction?: string; // Optional free-text instruction from user
}

function buildPrompt(
  config: AiRequestConfig,
  sectionData: BusinessPlanSection | null,
  allSections: Map<SectionSlug, BusinessPlanSection | null>,
  scenarioMetrics: ComputedMetrics
): string {
  const businessOverview = buildBusinessOverview();
  const crossContext = buildCrossSectionContext(allSections, config.sectionSlug);
  const scenarioContext = buildScenarioContext(scenarioMetrics);
  const targetContext = buildTargetSectionContext(config.sectionSlug, sectionData);
  const instruction = buildActionInstruction(config);

  return [
    '<business_context>',
    businessOverview,
    crossContext,
    scenarioContext,
    '</business_context>',
    '',
    '<current_section>',
    targetContext,
    '</current_section>',
    '',
    '<task>',
    instruction,
    config.userInstruction ? `\nAdditional instruction: ${config.userInstruction}` : '',
    '</task>',
  ].join('\n');
}
```

**Why XML-style tags:** Google's own Gemini prompting docs recommend using XML tags or Markdown headings to separate prompt sections. XML tags are clearer for structured data boundaries.

Source: [Gemini Prompt Design Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)

---

## 2. Prompt Templates for Business Plan Sections

### 2.1 Executive Summary Generation

The executive summary is unique: it synthesizes ALL other sections. It should be generated last or regenerated when other sections change.

```typescript
const EXECUTIVE_SUMMARY_PROMPT = `Generate an executive summary for the Fun Box business plan.

Synthesize the provided business context into a compelling executive summary with:
- "summary": A 2-3 paragraph overview covering what Fun Box is, the market opportunity, and the business model
- "mission": One sentence mission statement
- "vision": One sentence vision statement (where this business is going in 3-5 years)
- "keyHighlights": Array of 4-6 bullet points covering the strongest selling points (market size, unit economics, competitive advantage, launch readiness)

IMPORTANT: The executive summary must reflect the ACTUAL numbers from the business context. Do not generalize -- cite specific pricing, targets, and financial projections.`;
```

**Context requirements:** All other sections' data, scenario-derived metrics (revenue, profit, margins).

### 2.2 Market Analysis Enhancement

```typescript
const MARKET_ANALYSIS_PROMPT = `Enhance the market analysis section for Fun Box.

Given the current market data, improve and fill gaps:
- "targetDemographic": Validate and enhance the target demographic description
- "marketSize": Provide a TAM/SAM/SOM estimate narrative for mobile kids entertainment in Miami-Dade
- "competitors": For each competitor, strengthen the analysis with positioning insights
- "demographics": Enhance with relevant Miami-Dade demographic insights

KEY DATA POINTS TO INCORPORATE:
- Miami-Dade population ~2.7M, 75.3% non-English speakers at home
- Museum pricing benchmarks: $575-$1,250 range
- Party bus hourly rates: $150-$350 (validates mobile venue concept)
- Labor costs: recreation workers ~$18/hr, photographers ~$25.50/hr

If competitor data is sparse, note "Research needed: [specific competitor data gaps]" rather than inventing data.`;
```

### 2.3 Financial Projections Narrative

```typescript
const FINANCIAL_PROJECTIONS_PROMPT = `Generate the financial projections narrative for Fun Box.

Using the scenario engine's computed metrics and the cost structure provided:
- Describe the unit economics story (revenue per event, cost per event, margin)
- Explain the path to profitability month-by-month
- Highlight the break-even point
- Note key assumptions and sensitivity factors

CRITICAL: Use ONLY the numbers provided in the business context. Do not invent revenue figures or cost estimates. If a number is missing, flag it as "Assumption needed: [what is missing]".

The monthly projections array should match the financial data already in the system -- improve the narrative around it, do not replace the numbers.`;
```

### 2.4 Marketing Strategy Recommendations

```typescript
const MARKETING_STRATEGY_PROMPT = `Generate or improve the marketing strategy for Fun Box.

For each marketing channel:
- "description": Why this channel works for Fun Box specifically
- "tactics": 3-5 specific, actionable tactics (not generic advice)

Channel-specific guidance:
- Meta Ads: Focus on Instagram/Facebook for visual content, parent targeting, lookalike audiences
- Google Ads: Focus on high-intent search terms ("kids birthday party Miami", "mobile birthday party")
- Organic Social: TikTok/Instagram Reels strategy, 3-5x/week cadence, behind-the-scenes content
- Partnerships: Schools, after-school centers, Jellyfish Museum cross-promotion

Also suggest:
- "offers": 3-5 launch offers (early bird, referral, package bundles)
- Budget allocation rationale based on the provided channel budgets

IMPORTANT: Recommendations must be specific to the Miami market and the $800-$1,200 price range.`;
```

### 2.5 Risk Assessment Generation

```typescript
const RISK_ASSESSMENT_PROMPT = `Generate or enhance the risk assessment for Fun Box.

Use the deep research findings already in the business context:
- Miami-Dade parking regulations for large trailers in residential zones
- Jellyfish Museum opening Feb 2026 -- contract dependency
- FTSA compliance for automated messaging
- Slime/chemical activity dermatitis/burn risk
- Insurance and liability requirements

For each risk:
- "category": regulatory | operational | financial | legal
- "severity": high | medium | low (based on likelihood AND impact)
- "description": Specific description of the risk for Fun Box
- "mitigation": Concrete, actionable mitigation step

Also generate a compliance checklist with current status markers.

Do NOT minimize risks. This section is for the business owner's due diligence, not for investors.`;
```

Sources:
- [8 AI Prompts for Writing a Business Plan - BizPlanr](https://bizplanr.ai/blog/ai-prompts-for-writing-a-business-plan)
- [Top 400 AI Prompts for Business - FounderPath](https://founderpath.com/blog/top-ai-business-prompts)
- [Business Plan Prompt Guide - Dorik](https://dorik.com/blog/how-to-write-a-business-plan-with-chatgpt)

---

## 3. Response Formatting

### 3.1 Structured Output with Zod + Gemini responseJsonSchema

Gemini supports strict JSON output via `responseMimeType: "application/json"` + `responseJsonSchema`. Use Zod schemas (already standard in the JS ecosystem) and convert them via `zod-to-json-schema`.

```typescript
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { GoogleGenAI } from '@google/genai';

// Define schema matching the TypeScript interface
const executiveSummarySchema = z.object({
  summary: z.string().describe('2-3 paragraph business overview'),
  mission: z.string().describe('One-sentence mission statement'),
  vision: z.string().describe('One-sentence vision statement'),
  keyHighlights: z.array(z.string()).describe('4-6 key business highlights'),
});

// Convert to JSON Schema for Gemini
const jsonSchema = zodToJsonSchema(executiveSummarySchema);

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: prompt,
  config: {
    responseMimeType: 'application/json',
    responseJsonSchema: jsonSchema,
  },
});

// Response is guaranteed to match the schema
const result = executiveSummarySchema.parse(JSON.parse(response.text));
```

**Important limitation:** When using `responseMimeType: "application/json"`, streaming still works but you cannot parse partial JSON chunks. Two approaches:

1. **Structured output without streaming** -- for short sections, just wait for the full response
2. **Markdown streaming + post-parse** -- stream markdown text, then parse/convert to structured data at the end

**Recommendation for this app:** Use JSON mode (non-streaming) for structured data fields (arrays, numbers). Use streaming markdown for narrative text fields (summary, descriptions).

### 3.2 Hybrid Approach: Structured Envelope + Markdown Content

```typescript
// For sections with both structured data and narrative text:
const marketAnalysisSchema = z.object({
  targetDemographic: z.object({
    ageRange: z.string(),
    location: z.string(),
    radius: z.number(),
  }),
  marketSize: z.string().describe('TAM/SAM/SOM narrative, can use markdown'),
  competitors: z.array(z.object({
    name: z.string(),
    pricing: z.string(),
    strengths: z.string(),
    weaknesses: z.string(),
  })),
  demographics: z.object({
    population: z.number(),
    languages: z.array(z.string()),
    income: z.string(),
  }),
});
```

### 3.3 Displaying AI Responses Inline in React

For narrative content (strings with markdown), use a markdown renderer:

```typescript
import ReactMarkdown from 'react-markdown';

function AiGeneratedContent({ content }: { content: string }) {
  return (
    <div className="ai-content prose prose-sm max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
```

For streaming display (typewriter effect):

```typescript
function StreamingContent({ stream }: { stream: AsyncIterable<string> }) {
  const [text, setText] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for await (const chunk of stream) {
        if (cancelled) break;
        setText(prev => prev + chunk);
      }
    })();
    return () => { cancelled = true; };
  }, [stream]);

  return (
    <div className="ai-content prose prose-sm max-w-none">
      <ReactMarkdown>{text}</ReactMarkdown>
      <span className="animate-pulse">|</span>
    </div>
  );
}
```

Sources:
- [Gemini Structured Output Docs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Improving Structured Outputs - Google Blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)
- [AI UI Patterns - patterns.dev](https://www.patterns.dev/react/ai-ui-patterns/)
- [Gemini 2.5 Pro Verbose Output Control](https://eval.16x.engineer/blog/gemini-2-5-pro-verbose-output-control)

---

## 4. UX Patterns for AI Integration

### 4.1 "Ask AI" Button Placement and Interaction Flow

**Recommended pattern: Section-level AI action bar**

Place an "Ask AI" button group at the top-right of each business plan section card. This follows the **Inline Action** pattern from Shape of AI.

```
+--------------------------------------------------+
| Market Analysis                    [Ask AI v]     |
|--------------------------------------------------|
|                                                    |
|  [section content / form fields]                   |
|                                                    |
+--------------------------------------------------+
```

The dropdown provides contextual actions:
- **Generate** -- fill empty section from business context
- **Improve** -- enhance existing content
- **Expand** -- add more detail to existing content
- **Custom** -- free-text instruction input

**Interaction flow:**
1. User clicks "Ask AI" dropdown on a section
2. Selects action (generate/improve/expand/custom)
3. If custom: text input appears for instruction
4. Loading state replaces section content area (or appears as overlay)
5. AI response streams in (for narrative) or appears when complete (for structured)
6. Accept/Reject/Edit toolbar appears below the generated content
7. User accepts (data saves to atoms + Firestore) or rejects (reverts to previous)

### 4.2 Loading States During Generation

**Pattern: Skeleton + Progress Indicator**

```typescript
function AiLoadingState({ sectionName }: { sectionName: string }) {
  return (
    <div className="space-y-3 animate-in fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Generating {sectionName}...</span>
      </div>
      {/* Skeleton matching section layout */}
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
```

For streaming responses, replace the skeleton with the streaming content component once the first chunk arrives.

### 4.3 Accept / Reject / Edit Workflow

**Pattern: Suggestion Layer (non-destructive)**

The AI response is displayed as a **suggestion overlay**, not as a direct overwrite. The original content is preserved until the user explicitly accepts.

```typescript
interface AiSuggestionState {
  status: 'idle' | 'loading' | 'preview' | 'editing';
  original: BusinessPlanSection | null;
  suggested: BusinessPlanSection | null;
  edited: BusinessPlanSection | null; // user's modifications to the suggestion
}

function AiSuggestionToolbar({
  onAccept,
  onReject,
  onEdit,
  onRegenerate,
}: {
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-t pt-3 mt-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        <span>AI suggestion</span>
      </div>
      <div className="ml-auto flex gap-2">
        <Button variant="ghost" size="sm" onClick={onReject}>
          Reject
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onRegenerate}>
          Regenerate
        </Button>
        <Button size="sm" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}
```

**Key UX principles from research:**
- Always show results as a suggestion layer, not an overwrite
- Require explicit verification to accept, reject, or refine
- For edits that alter data/numbers, show what changed (diff view)
- Maintain continuous authorship and traceability

### 4.4 Inline Editing of AI-Generated Content

After clicking "Edit" on a suggestion, the content becomes editable in-place. For structured sections (arrays of competitors, risk items), this means the form fields become editable with the AI-suggested values pre-filled.

**Pattern:**
```
[AI generates] -> [Preview mode: read-only display]
                   -> [Accept] -> saves to state
                   -> [Edit] -> form fields pre-filled with AI values
                                -> user modifies -> [Save] -> saves modified version
                   -> [Reject] -> discards, returns to original
```

### 4.5 Regenerate / Refine Flow

**Regenerate** re-runs the same prompt. **Refine** allows the user to give additional instructions.

```typescript
function RefineInput({
  onRefine,
}: {
  onRefine: (instruction: string) => void;
}) {
  const [instruction, setInstruction] = useState('');

  return (
    <div className="flex gap-2 mt-2">
      <Input
        placeholder="e.g., Make it more concise, add competitor X..."
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        className="flex-1"
      />
      <Button size="sm" onClick={() => onRefine(instruction)}>
        Refine
      </Button>
    </div>
  );
}
```

When refining, append the user's instruction to the original prompt + include the previous AI output as context:

```
<previous_ai_output>
[the AI's last response]
</previous_ai_output>

<refinement_instruction>
The user wants to refine the above output: "Make it more concise and add competitor X"
</refinement_instruction>
```

Sources:
- [Inline Action Pattern - Shape of AI](https://www.shapeof.ai/patterns/inline-action)
- [AI UI Patterns - patterns.dev](https://www.patterns.dev/react/ai-ui-patterns/)
- [AI-Ready Design System Components](https://medium.com/design-bootcamp/the-ai-ready-design-system-the-5-components-your-component-library-must-update-first-531309f35d85)
- [Fix It, Tweak It, Transform It - UI for AI](https://medium.com/ui-for-ai/fix-it-tweak-it-transform-it-a-new-way-to-refine-ai-generated-content-dc53fd9d431f)
- [Tiptap AI Ask Button](https://tiptap.dev/docs/ui-components/components/ai-ask-button)

---

## 5. Context Window Management

### 5.1 Token Budget Allocation

Gemini 2.5 Pro has a 1M token context window (2M coming), but **more context is not better context**. Research shows models perform best with focused, relevant context.

**Token budget for this app (conservative):**

| Component | Estimated Tokens | Notes |
|-----------|-----------------|-------|
| System instruction | ~300 | Persona, tone, constraints |
| Business overview | ~200 | Static compressed summary |
| Cross-section summary | ~500-800 | Dynamically built from atoms |
| Scenario metrics | ~200 | Current computed metrics |
| Target section data | ~500-2,000 | Full JSON of current section |
| Generation instruction | ~200-500 | Action-specific prompt |
| **Total input** | **~2,000-4,000** | Well within limits |
| **Response budget** | **~1,000-3,000** | Section content |

**Total per request: ~3,000-7,000 tokens** -- far below Gemini's limits. No compression or chunking needed for this use case.

### 5.2 Priority Ordering Strategy

Place information in this order (most important first):

1. **System instruction** -- processed with highest priority
2. **Generation task** -- what to do (generate, improve, expand)
3. **Target section data** -- the section being worked on
4. **Business overview** -- core business facts
5. **Scenario metrics** -- current financial computations
6. **Cross-section summaries** -- other sections' data
7. **User refinement instruction** -- if refining a previous output

**Rationale:** Instructions at the start of the context window have the highest probability of being followed. The target section should come before cross-section context because it is the primary focus.

### 5.3 What to Include vs. Exclude

**Always include:**
- Business name, type, location, packages, pricing
- Target section's current data (even if empty)
- Scenario engine's computed metrics (revenue, costs, profit)
- KPI targets

**Include when relevant:**
- Other sections' data summaries (only sections related to the target)
- High-severity risks (when generating financial or operations sections)
- Competitor data (when generating market analysis or pricing sections)

**Never include:**
- Full launch plan task lists (too granular, not useful for other sections)
- Historical scenario comparisons (noise)
- UI state or metadata (plan ID, timestamps)

### 5.4 Dynamic Context Relevance

Not all cross-section data is equally relevant to every section. Use a relevance map:

```typescript
const SECTION_CONTEXT_RELEVANCE: Record<SectionSlug, SectionSlug[]> = {
  'executive-summary': [
    'financial-projections', 'market-analysis', 'product-service',
    'marketing-strategy', 'kpis-metrics', 'operations',
    'risks-due-diligence', 'launch-plan'
  ], // needs everything
  'market-analysis': [
    'product-service', 'marketing-strategy', 'kpis-metrics'
  ],
  'product-service': [
    'market-analysis', 'financial-projections', 'operations'
  ],
  'marketing-strategy': [
    'product-service', 'market-analysis', 'kpis-metrics', 'financial-projections'
  ],
  'operations': [
    'product-service', 'financial-projections', 'kpis-metrics'
  ],
  'financial-projections': [
    'product-service', 'marketing-strategy', 'operations', 'kpis-metrics'
  ],
  'risks-due-diligence': [
    'operations', 'financial-projections', 'product-service', 'market-analysis'
  ],
  'kpis-metrics': [
    'financial-projections', 'marketing-strategy', 'operations'
  ],
  'launch-plan': [
    'marketing-strategy', 'operations', 'product-service'
  ],
};
```

Sources:
- [Top Techniques to Manage Context Lengths in LLMs - Agenta](https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms)
- [Context Window Optimization Through Prompt Engineering - GoCodeo](https://www.gocodeo.com/post/context-window-optimization-through-prompt-engineering)
- [Managing Prompt Length and Context Windows - APXML](https://apxml.com/courses/prompt-engineering-llm-application-development/chapter-3-prompt-design-iteration-evaluation/managing-prompt-length-context)
- [LLM Context Windows - Kolena](https://www.kolena.com/guides/llm-context-windows-why-they-matter-and-5-solutions-for-context-limits/)

---

## 6. Gemini API Implementation Details

### 6.1 Streaming with generateContentStream

For narrative text fields, use streaming to show progressive output:

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

async function* streamSectionContent(
  prompt: string,
  systemInstruction: string
): AsyncGenerator<string> {
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 1.0, // Gemini recommended default
    },
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
```

### 6.2 Structured Output (Non-Streaming)

For complete section objects that must match TypeScript interfaces:

```typescript
async function generateSectionData<T>(
  prompt: string,
  systemInstruction: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema: zodToJsonSchema(schema),
      temperature: 1.0,
    },
  });

  return schema.parse(JSON.parse(response.text));
}
```

### 6.3 Temperature Setting

Google's own documentation for Gemini 2.5 models strongly recommends keeping temperature at its default value of 1.0. For business writing this is fine -- the structured output schema constrains the format, and the system instruction constrains the tone.

### 6.4 Controlling Verbosity

Gemini 2.5 Pro tends to be verbose. For business plan sections, this is mostly acceptable, but for concise fields:
- Add "Be concise" to the instruction for short fields
- Use `maxOutputTokens` to cap response length when appropriate
- Use the schema's `describe()` to hint at expected length (e.g., "One-sentence mission statement")

**Caution:** "Be concise" works well for structured data but can make narrative sections feel too brief. For narrative fields like market analysis or executive summary, let the model elaborate naturally.

Source: [Gemini 2.5 Pro Verbose Output Control](https://eval.16x.engineer/blog/gemini-2-5-pro-verbose-output-control)

---

## 7. Recommended Implementation Architecture

### 7.1 File Structure

```
src/
├── lib/
│   └── ai/
│       ├── gemini-client.ts      # GoogleGenAI initialization
│       ├── system-prompt.ts      # System instruction constant
│       ├── context-builder.ts    # buildCrossSectionContext, buildPrompt
│       ├── section-prompts.ts    # Per-section prompt templates
│       ├── section-schemas.ts    # Zod schemas for each section's AI output
│       └── types.ts              # AiRequestConfig, AiSuggestionState
├── hooks/
│   └── use-ai-suggestion.ts     # React hook managing AI request lifecycle
├── components/
│   ├── ai-action-bar.tsx         # "Ask AI" dropdown button
│   ├── ai-suggestion-preview.tsx # Suggestion display with accept/reject
│   ├── ai-loading-state.tsx      # Skeleton/spinner during generation
│   └── ai-refine-input.tsx       # Refinement text input
```

### 7.2 React Hook Pattern

```typescript
// hooks/use-ai-suggestion.ts
function useAiSuggestion(sectionSlug: SectionSlug) {
  const [state, setState] = useState<AiSuggestionState>({
    status: 'idle',
    original: null,
    suggested: null,
    edited: null,
  });

  const sectionData = useAtomValue(sectionDataAtom(sectionSlug));
  const allSections = useAtomValue(sectionDataMapAtom);
  const setSectionData = useSetAtom(updateSectionAtom);

  const generate = async (action: AiAction, userInstruction?: string) => {
    setState(prev => ({ ...prev, status: 'loading', original: sectionData }));

    try {
      const result = await generateSectionData(
        buildPrompt({ sectionSlug, action, userInstruction }, sectionData, allSections),
        SYSTEM_INSTRUCTION,
        getSectionSchema(sectionSlug)
      );
      setState(prev => ({ ...prev, status: 'preview', suggested: result }));
    } catch (error) {
      setState(prev => ({ ...prev, status: 'idle' }));
      // Handle error (toast notification)
    }
  };

  const accept = () => {
    const data = state.edited ?? state.suggested;
    if (data) {
      setSectionData(sectionSlug, data);
      setState({ status: 'idle', original: null, suggested: null, edited: null });
    }
  };

  const reject = () => {
    setState({ status: 'idle', original: null, suggested: null, edited: null });
  };

  return { state, generate, accept, reject };
}
```

### 7.3 Security Note

The Gemini API key should NOT be exposed in client-side code in production. Options:
1. **Firebase Cloud Function proxy** -- API key stays server-side, client calls the function
2. **Firebase AI Logic SDK** -- uses Firebase App Check instead of raw API key
3. **For MVP/solo use** -- client-side key with API key restrictions (HTTP referrer, quota limits)

This is covered in detail in the separate API security research.

---

## 8. Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Do Instead |
|---|---|---|
| Sending ALL section data in full JSON for every request | Wastes tokens, dilutes focus, can degrade output quality | Send compressed summaries + only target section in full |
| Using generic "write a business plan" prompts | Produces generic, non-specific content | Use section-specific prompts with business data context |
| Overwriting user content without preview | Users lose trust, feel loss of control | Always show as suggestion layer with accept/reject |
| Streaming JSON output | Partial JSON cannot be parsed or displayed meaningfully | Use non-streaming for structured output, streaming for narrative only |
| Setting temperature to 0 for "consistency" | Gemini docs recommend 1.0; low temperature can produce flat, repetitive text | Keep default 1.0, control output via schema and instructions |
| Including UI state or metadata in prompts | Noise that confuses the model | Only include business-relevant data |
| Single monolithic prompt for all sections | Different sections need different instructions and emphasis | Section-specific prompt templates |
| Asking AI to invent financial numbers | Creates false confidence, legally risky | Always pass actual data, flag missing data explicitly |

---

<open_questions>
## Open Questions

1. **Firebase AI Logic SDK vs raw Gemini API**
   - What we know: Firebase AI Logic (v12.1.0+) provides a Firebase-native way to call Gemini with App Check integration
   - What is unclear: Whether it supports `responseJsonSchema` and streaming equivalently to the raw `@google/genai` SDK
   - Recommendation: Evaluate Firebase AI Logic SDK as the primary integration path for security benefits

2. **Streaming + Structured Output Hybrid**
   - What we know: Streaming works for text; structured JSON output requires non-streaming for parseable results
   - What is unclear: Best UX when a section has both narrative and structured fields
   - Recommendation: Generate full section as structured JSON (non-streaming) with a loading skeleton; streaming only needed if sections have very long narrative fields

3. **Conversation History for Refinements**
   - What we know: Gemini supports multi-turn conversation
   - What is unclear: Whether to maintain a per-section conversation history for iterative refinement, or treat each request as independent
   - Recommendation: Start with independent requests (simpler), add conversation history only if refinement quality is poor without it
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Gemini API Prompt Design Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) -- official Google guide
- [Gemini Structured Output Docs](https://ai.google.dev/gemini-api/docs/structured-output) -- responseJsonSchema, Zod integration
- [Improving Structured Outputs - Google Blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/) -- July 2025 improvements
- [Context Engineering Guide - Prompt Engineering Guide](https://www.promptingguide.ai/guides/context-engineering-guide) -- context engineering principles
- [AI UI Patterns - patterns.dev](https://www.patterns.dev/react/ai-ui-patterns/) -- React AI patterns (streaming, state, loading)
- [Inline Action Pattern - Shape of AI](https://www.shapeof.ai/patterns/inline-action) -- UX pattern for inline AI actions
- [Firebase AI Logic Streaming](https://firebase.google.com/docs/ai-logic/stream-responses) -- generateContentStream

### Secondary (MEDIUM confidence)
- [Gemini 2.5 Pro Verbose Output Control](https://eval.16x.engineer/blog/gemini-2-5-pro-verbose-output-control) -- conciseness techniques
- [Context Engineering - FlowHunt](https://www.flowhunt.io/blog/context-engineering/) -- context engineering definition and patterns
- [Context Window Optimization - GoCodeo](https://www.gocodeo.com/post/context-window-optimization-through-prompt-engineering) -- priority ordering
- [LLM Context Windows - Kolena](https://www.kolena.com/guides/llm-context-windows-why-they-matter-and-5-solutions-for-context-limits/) -- context management strategies
- [8 AI Prompts for Business Plan - BizPlanr](https://bizplanr.ai/blog/ai-prompts-for-writing-a-business-plan) -- section-specific prompt patterns
- [Top 400 AI Business Prompts - FounderPath](https://founderpath.com/blog/top-ai-business-prompts) -- business prompt templates
- [AI-Ready Design System - Medium](https://medium.com/design-bootcamp/the-ai-ready-design-system-the-5-components-your-component-library-must-update-first-531309f35d85) -- accept/reject component patterns
- [Fix It Tweak It Transform It - Medium](https://medium.com/ui-for-ai/fix-it-tweak-it-transform-it-a-new-way-to-refine-ai-generated-content-dc53fd9d431f) -- refinement UX patterns
- [Gemini 2.5 Pro API Guide - DataCamp](https://www.datacamp.com/tutorial/gemini-2-5-pro-api) -- system instruction usage

### Tertiary (LOW confidence - needs validation)
- [Context Lengths Management - Agenta](https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms) -- page content was inaccessible, general principles applied
- [Prompt Engineering for Business - Gend.co](https://www.gend.co/blog/prompt-engineering-for-business) -- ROI claims need independent verification
</sources>

<metadata>
## Metadata

**Research scope:**
- Prompt engineering patterns for per-section AI assistance
- Context engineering architecture for business plan generation
- Gemini 2.5 Pro API: system instructions, structured output, streaming
- React UX patterns: ask AI button, accept/reject/edit workflow, streaming display
- Context window management and token budget allocation

**Confidence breakdown:**
- Gemini API features (structured output, streaming, system instructions): HIGH -- from official docs
- Context engineering architecture: HIGH -- from multiple authoritative sources
- Section-specific prompt templates: MEDIUM -- adapted from general business plan prompts to Fun Box specifics
- UX patterns (accept/reject, inline editing): HIGH -- from established AI UX pattern libraries
- Token budget estimates: MEDIUM -- based on general token-to-text ratios, not measured

**Research date:** 2026-02-11
**Valid until:** 2026-04-11 (60 days -- Gemini API evolving, patterns stable)
</metadata>

---

*Phase: 04-ai-and-export*
*Research completed: 2026-02-11*
*Ready for planning: yes*
