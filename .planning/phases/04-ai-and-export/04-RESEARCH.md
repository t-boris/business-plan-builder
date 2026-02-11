# Phase 4: AI + Export — Research

**Researched:** 2026-02-11
**Domain:** Gemini 2.5 Pro API integration, PDF generation in React, prompt engineering for business plan AI
**Confidence:** HIGH

<research_summary>
## Summary

Researched three domains for Phase 4: (1) Gemini 2.5 Pro API — authentication, SDK, security architecture; (2) PDF generation — client-side options for professional business plan export; (3) Prompt engineering — per-section contextual AI assistance patterns.

**Key findings:**
- **Gemini SDK:** Use `@google/genai` v1.40+ (the old `@google/generative-ai` is deprecated since Aug 2025). For production security, use Firebase AI Logic SDK (`firebase/ai`) which proxies API calls through Firebase — no API key in client code.
- **PDF generation:** `@react-pdf/renderer` v4.3.2 is the clear winner — React 19 compatible, client-side only, vector text, bookmarks, page numbers. Charts captured via `recharts-to-png` as PNG base64.
- **Prompt engineering:** Context engineering architecture with system instruction (persona) + compressed business context + target section data. Structured JSON output via Zod schemas. Accept/reject/edit suggestion layer UX.
- **API key creation:** Google AI Studio at aistudio.google.com — one-click key generation, free tier gives 100 RPD for Pro.
</research_summary>

---

## 1. Gemini 2.5 Pro API

### 1.1 How to Create a Gemini API Key

**Step-by-step (Google AI Studio — recommended for solo developers):**

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Open Dashboard > Projects from the left panel
4. Click **"Create API key"**
   - Choose "Create a key in a new project" (auto-creates a Google Cloud project)
   - Or select an existing GCP project
5. Your API key is immediately generated — copy it
6. Direct link: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

**For first-time users:** Google AI Studio auto-creates a default GCP project and API key upon accepting Terms of Service.

**To upgrade to paid tier (higher limits):**
1. Go to Settings > Plan Information in AI Studio
2. Enable Cloud Billing on your Google Cloud account
3. Return to API Keys and click "Upgrade"

### 1.2 SDK — @google/genai (Current)

**IMPORTANT:** The old `@google/generative-ai` package is **DEPRECATED** (support ended Aug 31, 2025).

**Current package: `@google/genai` v1.40.0+**

```bash
npm install @google/genai
```

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'YOUR_API_KEY' });

// Non-streaming
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: 'Your prompt here',
  config: {
    systemInstruction: 'You are a business writing assistant.',
    maxOutputTokens: 8192,
    temperature: 1.0, // Gemini recommended default
  },
});
console.log(response.text);

// Streaming
const stream = await ai.models.generateContentStream({
  model: 'gemini-2.5-pro',
  contents: 'Your prompt here',
});
for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### 1.3 Firebase AI Logic SDK (Production — Recommended)

For production web apps, use the Firebase AI Logic SDK. It proxies API calls through Firebase — the Gemini API key is **never exposed** in client code.

```typescript
import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

const firebaseApp = initializeApp(firebaseConfig);
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: 'gemini-2.5-pro' });

const result = await model.generateContent('Your prompt here');
const text = result.response.text();
```

**Advantages:**
- API key never in client code
- Firebase App Check integration (attestation)
- No custom backend needed
- Seamless with existing Firebase setup

**Limitations:** No context caching, no fine-tuning, no embeddings through Firebase AI Logic.

### 1.4 Model Specs

| Model | ID | Context Window | Max Output |
|-------|----|---------------|------------|
| Gemini 2.5 Pro | `gemini-2.5-pro` | 1,048,576 tokens (1M) | 65,536 tokens |
| Gemini 2.5 Flash | `gemini-2.5-flash` | 1,048,576 tokens (1M) | 65,536 tokens |

### 1.5 Rate Limits

| Tier | RPM | RPD | TPM |
|------|-----|-----|-----|
| Free (Pro) | 5 | 100 | 250,000 |
| Free (Flash) | 10 | 250 | 250,000 |
| Paid Tier 1 (Pro) | 150 | 1,000 | 1,000,000 |

### 1.6 Pricing (Gemini 2.5 Pro)

| Context Size | Input (per 1M tokens) | Output (per 1M tokens) |
|-------------|----------------------|------------------------|
| Up to 200K tokens | $1.25 | $10.00 |
| Over 200K tokens | $2.50 | $20.00 |

**Cost estimate per section generation: ~$0.12** (with default thinking budget of 8,192 tokens).

### 1.7 Structured Output

```typescript
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: prompt,
  config: {
    responseMimeType: 'application/json',
    responseJsonSchema: zodToJsonSchema(myZodSchema),
  },
});
const result = myZodSchema.parse(JSON.parse(response.text));
```

### 1.8 Security Architecture

**Client-side API keys are NOT safe for production.** The key is embedded in the JS bundle and visible in DevTools.

**Recommended architecture:**
```
[React App] → [Firebase AI Logic Proxy] → [Gemini API]
                     |
             API key stored here
             App Check verified here
```

**For this project (MVP/solo use):** Start with direct `@google/genai` for development, switch to Firebase AI Logic for production. Restrict API key via Google Cloud Console (HTTP referrer, API restriction to Generative Language API only).

---

## 2. PDF Generation

### 2.1 Recommendation: @react-pdf/renderer v4.3.2

**Why this library:**
- Full React 19.2 + TypeScript + Vite 7 compatibility (since v4.1.0)
- Client-side only — perfect for Firebase Hosting static site
- Vector text (searchable, crisp), proper bookmarks, internal links, page numbers
- JSX components + CSS-in-JS styling — React-idiomatic
- Active maintenance: 16,300+ GitHub stars, 860,000+ weekly downloads

**Bundle size:** ~533 kB gzipped — **must lazy-load** with `React.lazy()`

```bash
npm install @react-pdf/renderer recharts-to-png@3
```

### 2.2 Key Capabilities

| Feature | Support |
|---------|---------|
| Multi-page documents | Auto-wrapping, `break` prop for forced breaks |
| Headers/footers | `fixed` prop repeats on every page |
| Page numbers | `render={({pageNumber, totalPages}) => ...}` |
| Table of Contents | Bookmarks + internal links via `id` and `src="#id"` |
| Tables | Manual flex layout (no built-in table component) |
| Images | JPG, PNG, base64 data URIs |
| SVG | Built-in SVG primitives (not nested SVG elements) |
| Cover page | Standard page component |

### 2.3 Chart Inclusion Strategy

**Recharts v3.7.0 → PNG → @react-pdf/renderer `<Image>`**

Using `recharts-to-png` v3.x:

```typescript
import { useGenerateImage } from 'recharts-to-png';

const [getDivPng, { ref }] = useGenerateImage<HTMLDivElement>({
  quality: 1,
  type: 'image/png',
});

// CRITICAL: isAnimationActive={false} on all chart components
<div ref={ref}>
  <BarChart data={data}>
    <Bar dataKey="value" isAnimationActive={false} />
  </BarChart>
</div>

const png = await getDivPng(); // base64 data URI
// Pass to @react-pdf/renderer: <Image src={png} />
```

### 2.4 PDF Architecture

```
src/features/pdf-export/
├── components/
│   ├── BusinessPlanDocument.tsx  # Main Document wrapper
│   ├── CoverPage.tsx            # Company name, date
│   ├── TableOfContents.tsx      # Links to sections
│   ├── SectionPage.tsx          # Reusable section template
│   ├── FinancialCharts.tsx      # Embedded chart images
│   ├── ScenarioTable.tsx        # Flex-based table layout
│   ├── PageHeader.tsx           # Fixed header
│   └── PageFooter.tsx           # Fixed footer with page numbers
├── styles/
│   └── pdfStyles.ts             # StyleSheet definitions
├── hooks/
│   └── useChartCapture.ts       # Captures Recharts as PNG
├── utils/
│   └── generatePdf.ts           # Orchestrates capture + blob
└── PdfExportButton.tsx          # React.lazy entry point
```

### 2.5 Alternatives Considered

| Library | Verdict | Why Not |
|---------|---------|---------|
| jsPDF + html2canvas | Rejected | Raster output (not searchable), no bookmarks, poor multi-page |
| pdfmake | Rejected | 2MB bundle, not React-idiomatic |
| react-to-print | Rejected | No programmatic control, depends on browser print dialog |
| Puppeteer/Playwright | Rejected | Requires server — not compatible with Firebase Hosting static site |

---

## 3. Prompt Engineering

### 3.1 Architecture: Context Engineering

Per-section AI requests use a layered context approach:

```
[System Instruction]     — Persona, tone, constraints (constant)
[Business Context Block] — Compressed summary of ALL sections (~200 tokens)
[Target Section Data]    — Full detail of section being edited (variable)
[Generation Instruction] — What to do: generate, improve, expand
```

### 3.2 System Prompt

```typescript
const SYSTEM_INSTRUCTION = `You are a business plan writing assistant for "Fun Box,"
a premium mobile kids birthday party service in Miami.

ROLE: Expert business plan writer with knowledge of Miami's entertainment market.
TONE: Professional but approachable, data-driven, concise, actionable.
CONSTRAINTS:
- Never invent financial numbers — use only provided data
- Flag missing data as "Data needed: [what]"
- All monetary values in USD
- Consider 3 packages: Ocean Starter ($800), Explorer ($980), VIP ($1,200)
OUTPUT: Structured JSON matching the provided schema. Markdown within text fields.`;
```

### 3.3 Section-Specific Prompts

Each of the 9 sections has a dedicated prompt template. Key patterns:
- **Executive Summary:** Synthesizes ALL other sections — generated last
- **Financial Projections:** Explicitly prohibited from inventing numbers
- **Risk Assessment:** References deep research findings (parking regs, FTSA, insurance)
- **Marketing Strategy:** Channel-specific tactics for Miami market

### 3.4 UX Pattern: Suggestion Layer

```
User clicks "Ask AI" → dropdown (Generate/Improve/Expand/Custom)
→ Loading state (skeleton)
→ AI response appears as suggestion (not overwrite)
→ Accept / Reject / Edit toolbar
→ Accept saves to atoms + Firestore
→ Reject reverts to original
```

### 3.5 Cross-Section Context Relevance Map

Not all sections need all other sections' data. A relevance map controls which sections are included:

| Target Section | Relevant Context |
|---------------|-----------------|
| Executive Summary | ALL sections |
| Market Analysis | Product, Marketing, KPIs |
| Financial Projections | Product, Marketing, Operations, KPIs |
| Marketing Strategy | Product, Market, KPIs, Financial |
| Risks | Operations, Financial, Product, Market |

### 3.6 Token Budget Per Request

~3,000-7,000 tokens total — far below Gemini's 1M limit. No compression needed.

---

## 4. Packages to Install

```bash
npm install @google/genai zod zod-to-json-schema @react-pdf/renderer recharts-to-png@3
```

**Note:** `zod` may already be installed (check). `react-markdown` for AI response display (if streaming markdown is used).

---

## 5. Key Decisions for Planning

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Gemini SDK | `@google/genai` vs Firebase AI Logic | Start with `@google/genai` for dev, migrate to Firebase AI Logic for production |
| Streaming | Streaming vs non-streaming | Non-streaming with JSON schema for structured sections; streaming only for long narrative |
| PDF library | @react-pdf/renderer vs others | @react-pdf/renderer v4.3.2 |
| Chart capture | recharts-to-png vs manual SVG | recharts-to-png v3 (simpler, proven) |
| API key security | Client-side vs proxy | Client-side for MVP, Firebase AI Logic proxy for production |

---

## 6. Open Questions

1. **Firebase AI Logic SDK structured output support** — Does it support `responseJsonSchema` equivalently to raw `@google/genai`? Evaluate during implementation.
2. **Streaming + structured hybrid UX** — Best UX when sections have both narrative and structured fields? Start with non-streaming JSON for all, add streaming only if UX feels slow.
3. **Conversation history for refinements** — Start with independent requests, add multi-turn only if refinement quality is poor.

---

<sources>
## Sources

### Gemini API
- [Google AI Studio - API Key Creation](https://aistudio.google.com/app/apikey)
- [Gemini API Key Management](https://ai.google.dev/gemini-api/docs/api-key)
- [Gemini API Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini Models Reference](https://ai.google.dev/gemini-api/docs/models)
- [@google/genai npm](https://www.npmjs.com/package/@google/genai)
- [Firebase AI Logic Docs](https://firebase.google.com/docs/ai-logic)
- [Firebase AI Logic Get Started](https://firebase.google.com/docs/ai-logic/get-started)
- [Gemini Structured Output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini Thinking Docs](https://ai.google.dev/gemini-api/docs/thinking)

### PDF Generation
- [react-pdf.org](https://react-pdf.org)
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer)
- [react-pdf.org/advanced](https://react-pdf.org/advanced)
- [react-pdf.org/svg](https://react-pdf.org/svg)
- [recharts-to-png GitHub](https://github.com/brammitch/recharts-to-png)

### Prompt Engineering
- [Gemini Prompt Design Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [Context Engineering Guide](https://www.promptingguide.ai/guides/context-engineering-guide)
- [AI UI Patterns - patterns.dev](https://www.patterns.dev/react/ai-ui-patterns/)
- [Inline Action Pattern - Shape of AI](https://www.shapeof.ai/patterns/inline-action)
</sources>

<metadata>
**Research date:** 2026-02-11
**Valid until:** 2026-04-11
**Confidence:** HIGH for all three domains (verified against official docs)
**Ready for planning:** YES
</metadata>
