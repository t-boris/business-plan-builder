# Business Planning Platform

## What This Is

A multi-business planning and scenario calculator web app. Users create multiple businesses, each with configurable plan sections, financial scenario modeling with custom variables, and AI-powered content generation. The app emphasizes financial calculations and what-if scenarios as its core — it's a business calculator first, document editor second.

## Core Value

Financial scenario modeling across multiple businesses with real-time derived metrics — users must be able to create a business, configure its variables, and instantly see how changes to inputs affect revenue, costs, and profitability.

## Requirements

### Validated

- ✓ React SPA with Tailwind + shadcn UI — existing
- ✓ Firebase Auth (Google OAuth + email/password) — existing
- ✓ Firestore data persistence with debounced auto-save — existing
- ✓ Jotai atomic state management with derived computations — existing
- ✓ 9 business plan section editors (executive-summary, market-analysis, product-service, marketing-strategy, operations, financial-projections, risks-due-diligence, kpis-metrics, launch-plan) — existing
- ✓ Scenario engine with variables, derived metrics, scenario comparison — existing
- ✓ AI content generation via Gemini (generate/improve/expand per section) — existing
- ✓ Market research via Perplexity API — existing
- ✓ PDF export with @react-pdf/renderer — existing
- ✓ Dashboard with KPI cards and 12-month projection chart — existing

### Active

- [ ] Multi-business CRUD — create, switch, delete businesses under one user account
- [ ] New Firestore data model — `users/{uid}/businesses/{businessId}/` with sections, scenarios, state nested per business
- [ ] Business profile/config — name, type, description, location, enabled sections, custom settings per business
- [ ] Configurable sections per business — user picks which of the 9 sections are relevant when creating a business
- [ ] Generic section defaults — remove all Fun Box hardcoded content from 12+ files, replace with business-context-aware defaults
- [ ] Predefined variable library — library of common business variables (revenue drivers, cost categories) organized by business type; user picks what applies to their business
- [ ] Hybrid scenario engine — start with variable template based on business type, allow add/remove/customize variables
- [ ] Business-aware AI system prompt — dynamically build system prompt from business profile (name, type, location, context) instead of hardcoded Fun Box
- [ ] Shareable business access — generate share URL; any authenticated user who opens it gets full edit access added to their account
- [ ] Business selector UI — sidebar/header component to switch between businesses
- [ ] Dynamic plan ID — replace hardcoded `'default-plan'` with selected business ID throughout the app

### Out of Scope

- Multi-user roles/permissions beyond owner + full-edit sharing — complexity not justified for v1
- Real-time collaborative editing (Firestore listeners for multi-user sync) — not needed yet, debounced saves sufficient
- Business templates marketplace — predefined variable library is enough for v1
- Custom formula builder UI — users pick from predefined variables, no visual formula editor
- PDF export enhancements — existing PDF works, not a priority for this transformation
- Testing infrastructure — focus on functionality first, add tests as separate initiative
- Mobile-native app — responsive web is sufficient
- Payment/billing — this is a personal tool, no monetization layer

## Context

**Brownfield transformation:** The app currently works fully for a single hardcoded business ("Fun Box" — Miami kids party/ocean workshop company). All 9 sections, scenario engine, AI generation, and PDF export are functional but deeply tied to Fun Box-specific data, defaults, and terminology.

**Core transformation challenge:** 12+ files contain hardcoded business-specific content (see `.planning/codebase/CONCERNS.md`). The Firestore data model assumes a single plan (`'default-plan'`). The scenario engine atoms are hardcoded for Fun Box variables (pricing tiers, crew costs, museum fees).

**What works well and should be preserved:**
- Feature-based architecture with `useSection()` generic hook pattern
- Jotai atoms + derived computations pattern for scenario engine
- AI integration pattern (section prompts + Zod schemas + Gemini structured generation)
- UI framework (Tailwind + shadcn + Radix)

**Key insight from user:** The app is fundamentally a **financial calculator** that also produces business plan documents. Numbers and scenario modeling are the primary value; text sections are secondary. This should drive prioritization.

## Constraints

- **Tech stack**: Must stay on Firebase (Auth + Firestore) and React + Tailwind + shadcn — no database or UI framework migration
- **API keys**: Gemini and Perplexity API keys remain client-side for now (server proxy is a future improvement)
- **Firestore structure**: New data model must support many businesses per user efficiently; design for Firestore's document/collection model (not relational)
- **Fresh start OK**: No need to migrate existing Fun Box data; can start clean with the new multi-business architecture

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Per-user multi-business (not per-deployment) | User needs multiple businesses in one account without redeployment | — Pending |
| Predefined variable library (not custom formulas) | Simpler UX, covers 90% of use cases, avoids formula builder complexity | — Pending |
| Shareable link with full edit access | Simplest sharing model, no role management overhead | — Pending |
| Configurable sections per business | Different businesses need different sections (seasonality, local marketing, etc.) | — Pending |
| Business-aware AI prompts | AI must know business context to generate relevant content | — Pending |
| Fresh start (no Fun Box migration) | Cleaner implementation, no legacy data constraints | — Pending |
| PDF export is nice-to-have | May break during refactoring, fix after core features work | — Pending |

---
*Last updated: 2026-02-11 after initialization*
