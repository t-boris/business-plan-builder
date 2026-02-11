# Fun Box Planning

## What This Is

A Firebase-hosted web application (React + TypeScript) that helps organize, model, and plan the "Fun Box" kids birthday party business in Miami. It provides a structured business plan with interactive UI for each section, what-if scenario modeling across financial/marketing/operational dimensions, AI-powered assistance via Gemini 2.5 Pro for filling knowledge gaps, and generates a polished business plan (in-app view + PDF export).

## Core Value

Interactive what-if scenario modeling that lets the owner see how changing any business variable (pricing, CAC, conversion, capacity, costs) ripples through the entire business plan in real time.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Dashboard-style UI with sidebar navigation across business plan sections
- [ ] Business plan structure with dedicated UI for each section:
  - Executive Summary
  - Market Analysis (Miami demographics, competitive landscape, pricing benchmarks)
  - Product/Service (3 packages: Ocean Starter $800, Ocean Explorer $980, Ocean VIP $1,200)
  - Marketing Strategy (Meta Ads, Google Ads, organic social, partnerships)
  - Operations (crew, capacity, travel radius, scheduling, safety protocols)
  - Financial Projections (unit economics, revenue, costs, P&L)
  - Risks & Due Diligence (regulatory, parking, compliance, liability — from deep research)
  - KPIs & Metrics (leads, conversion, CAC, average check)
  - Launch Plan (3 stages: preparation, soft launch, scale)
- [ ] What-if scenario engine:
  - Financial scenarios: change pricing, costs, ticket economics, crew size → see P&L impact
  - Marketing scenarios: adjust ad budgets per channel, CAC, conversion rates → see lead/booking projections
  - Operational scenarios: bookings/month, capacity ceiling, travel radius, weekend slot constraints
  - Side-by-side scenario comparison
  - Scenarios update all dependent sections in real time
- [ ] AI assistance via Gemini 2.5 Pro:
  - Per-section "Ask AI" to generate content, suggest numbers, fill gaps
  - Contextual — AI sees the current section data and business context
  - Works inline within each business plan section
- [ ] Business plan generation:
  - Polished in-app read-only view of complete business plan
  - PDF export with professional formatting
  - Pulls all data from filled sections + selected scenario
- [ ] Data persistence in Firebase (Firestore) — all inputs saved automatically
- [ ] Deep research integration: regulatory risks, competitive benchmarks, compliance checklist, safety concerns integrated into relevant sections as warnings/context
- [ ] Pre-populated with known business data (packages, KPI targets, marketing channels, partnership details, AI sales agent specs)

### Out of Scope

- CRM or booking system — this is a planning tool, not operational software
- Landing page builder — planning only, not building the actual marketing site
- Multi-user or sharing — solo tool for the business owner
- AI sales agent implementation — the app documents the agent's design, it doesn't build the agent
- Instagram/WhatsApp integration — planning and documentation only
- Actual ad campaign management — the app models ad spend, doesn't run ads

## Context

**The Business:** "Fun Box" is a premium mobile kids birthday party service in Miami. Ocean-themed workshops + Jellyfish Museum tours. Three packages ($800–$1,200) for 15 participants each. Target: parents 28–50 in Miami metro, 15–25 mile radius.

**Marketing Stack:** Meta Ads (primary — leads + messages), Google Ads (hot traffic search), organic TikTok/Instagram Reels (3–5x/week), partnerships (schools, after-school centers, Jellyfish Museum).

**Key Business Numbers:**
- Packages: $800 / $980 / $1,200
- Target: 100–150 leads/month, 15–25% conversion
- CAC target: $10–30 per lead, $50–120 per booking
- Launch: March 2026 (soft launch March 1–14, scale from March 15)

**AI Sales Agent (documented, not built):** Gemini-powered agent for Instagram/WhatsApp that follows structured sales scripts, handles objections, and escalates to humans. State machine architecture with strict sales logic.

**Deep Research Findings (from investment review):**
- Miami-Dade parking regulations may restrict large trailers in residential zones
- Jellyfish Museum opening Feb 2026 — contract terms needed before underwriting "15 tickets included"
- FTSA compliance required for any automated texting/messaging
- Slime/chemical activities carry documented dermatitis/burn risk — safety protocols required
- Museum pricing benchmarks: $575–$1,250 range validates pricing band
- 75.3% of Miami-Dade speaks non-English at home — bilingual marketing opportunity
- Party bus hourly rates $150–$350 validate mobile venue concept
- Labor costs: recreation workers ~$18/hr, photographers ~$25.50/hr in Miami metro

## Constraints

- **Tech Stack**: React + TypeScript, Firebase (Hosting + Firestore), Gemini 2.5 Pro API — chosen by owner
- **Deployment**: Firebase Hosting — must be SPA-compatible
- **AI Model**: Gemini 2.5 Pro specifically — not OpenAI, not Claude
- **Language**: UI in English (business operates in multilingual Miami market)
- **Solo User**: No auth system needed beyond basic Firebase setup — single user tool

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + TypeScript | Owner preference, strong Firebase integration | — Pending |
| Firebase (Hosting + Firestore) | Owner requirement, simple deployment, real-time data | — Pending |
| Gemini 2.5 Pro for AI | Owner preference for Google ecosystem | — Pending |
| Dashboard UI (not wizard) | Owner prefers overview with drill-down over step-by-step | — Pending |
| All-in-one planning tool | What-if + business plan + AI equally important, not phased | — Pending |
| Deep research integrated | Risk/compliance data embedded in relevant sections, not separate | — Pending |

---
*Last updated: 2026-02-11 after initialization*
