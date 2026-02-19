# Roadmap: Business Planning Platform

## Overview

Transform a single-business Fun Box planning app into a generic multi-business platform, then harden it for production with security, reliability, testing, and observability.

## Domain Expertise

None

## Milestones

- ✅ **v1.0 Multi-Business Platform** - Phases 1-12 (shipped 2026-02-12)
- ✅ **v2.0 Production Readiness** - Phases 13-16 (shipped 2026-02-18)
- **v3.0 Section Enhancements** - Phases 17+

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>✅ v1.0 Multi-Business Platform (Phases 1-12) - SHIPPED 2026-02-12</summary>

- [x] **Phase 1: Firestore Data Model** - New multi-business data structure, TypeScript types, Firestore service layer
- [x] **Phase 2: Business CRUD** - Create, list, switch, delete businesses with selector UI
- [x] **Phase 3: Dynamic Business Context** - Replace hardcoded plan ID, wire atoms/hooks/routing to active business
- [x] **Phase 4: Strip Hardcoded Content** - Remove Fun Box from 12+ files, create generic defaults system
- [x] **Phase 5: Business Profile & Section Config** - Business profile editor, configurable sections per business
- [x] **Phase 6: Variable Library** - Predefined business variables organized by business type
- [x] **Phase 7: Generic Scenario Engine** - Dynamic atoms from variable library, adaptive derived metrics
- [x] **Phase 8: Business-Aware AI** - Dynamic system prompt and section prompts from business context
- [x] **Phase 9: Sharing & Access** - Shareable URLs, access granting, multi-user business list
- [x] **Phase 10: Dashboard & Navigation** - Multi-business dashboard, updated sidebar and breadcrumbs
- [x] **Phase 11: Export Updates** - Fix PDF export and business plan view for generic businesses
- [x] **Phase 12: Integration & Polish** - End-to-end verification, edge cases, UI polish

### Phase 1: Firestore Data Model
**Goal**: Design and implement the new multi-business Firestore document structure and TypeScript types. This is the foundation everything else builds on.
**Depends on**: Nothing (first phase)
**Research**: Unlikely (Firestore patterns already established in codebase)
**Plans**: 2 plans

Plans:
- [x] 01-01: Define TypeScript types and interfaces for multi-business data model (Business, BusinessConfig, BusinessProfile)
- [x] 01-02: Implement new Firestore service layer (business CRUD operations, section/scenario paths scoped to business)

### Phase 2: Business CRUD
**Goal**: Users can create new businesses, see a list of their businesses, switch between them, and delete businesses. Business selector appears in UI.
**Depends on**: Phase 1
**Research**: Unlikely (standard CRUD with existing Firebase patterns)
**Plans**: 5 plans

Plans:
- [x] 02-01: Business state atoms, operations hook, and template definitions
- [x] 02-02: Create business page with template picker UI
- [x] 02-03: Business list page, empty state, and delete dialog
- [x] 02-04: Sidebar business switcher dropdown and breadcrumbs
- [x] 02-05: Router and provider integration for business features

### Phase 3: Dynamic Business Context
**Goal**: Replace the hardcoded `'default-plan'` ID with the dynamically selected business ID. All atoms, hooks, and routes become business-aware.
**Depends on**: Phase 2
**Research**: Unlikely (internal refactoring of existing patterns)
**Plans**: 2 plans

Plans:
- [x] 03-01: Refactor store atoms and hooks to use dynamic business ID (plan-atoms, scenario-atoms, useSection, useScenarioSync)
- [x] 03-02: Update routing and layout to include business context (URL structure, breadcrumbs, sidebar)

### Phase 4: Strip Hardcoded Content
**Goal**: Remove all Fun Box-specific content from 12+ files. Create a generic defaults system that loads business-context-aware defaults instead of hardcoded values.
**Depends on**: Phase 3
**Research**: Unlikely (content removal + defaults extraction)
**Plans**: 3 plans

Plans:
- [x] 04-01: Extract constants and defaults into configurable structure (constants.ts, system-prompt.ts, default section data)
- [x] 04-02: Clean section components (executive-summary, market-analysis, product-service, marketing-strategy, operations, financial-projections)
- [x] 04-03: Clean remaining files (risks-due-diligence, kpis-metrics, launch-plan, dashboard, auth login-page, PDF CoverPage)

### Phase 5: Business Profile & Section Config
**Goal**: Business profile editor where users set name, type, location, description. Section configurator where users pick which of the 9 sections are relevant for their business.
**Depends on**: Phase 4
**Research**: Unlikely (UI forms with existing component patterns)
**Plans**: 2 plans

Plans:
- [x] 05-01: Business profile editor page (name, type, industry, location, description, logo/color)
- [x] 05-02: Section configurator (toggle sections on/off per business, section order customization)

### Phase 6: Variable Library
**Goal**: Define a library of predefined business variables organized by business type (SaaS, retail, service, restaurant, etc.). Users pick which variables apply to their business. This is the foundation for the generic scenario engine.
**Depends on**: Phase 1
**Research**: Likely (need to define meaningful variable sets for different business types)
**Research topics**: Common business metrics by industry, revenue driver categories, cost structure patterns for SaaS/retail/service/restaurant/event businesses
**Plans**: 4 plans

Plans:
- [x] 06-01: Define variable library data model (VariableDefinition, VariableCategory, BusinessTypeTemplate)
- [x] 06-02: Populate variable library with templates for all 7 business types
- [x] 06-03: Variable picker UI (browse by category, select variables, preview derived metrics)
- [x] 06-04: Formula engine integration and variable evaluation

### Phase 7: Generic Scenario Engine
**Goal**: Refactor the scenario engine from hardcoded Fun Box atoms to dynamic atoms driven by the variable library. Derived metrics compute automatically based on selected variables. Scenario comparison works with any variable set.
**Depends on**: Phase 6, Phase 3
**Research**: Likely (dynamic Jotai atom creation at runtime from variable definitions)
**Research topics**: Jotai atom families, dynamic atom creation patterns, atom-in-atom patterns for variable-driven state, performance implications of dynamic atoms
**Plans**: 4 plans

Plans:
- [x] 07-01: Dynamic atom architecture (add scenarioValuesAtom, evaluatedValuesAtom, DynamicScenario type alongside existing atoms)
- [x] 07-02: Migrate scenario persistence (Firestore functions, sync hook, provider, manager to dynamic atoms)
- [x] 07-03: Migrate scenario UI (dynamic controls from variable definitions, dynamic dashboard, merge tabs)
- [x] 07-04: Comparison, main dashboard, and legacy cleanup (rewrite remaining consumers, remove all hardcoded atoms/types)

### Phase 8: Business-Aware AI
**Goal**: AI system prompt dynamically built from business profile (name, type, location, context). Section prompts adapt to the business type and its selected variables. AI generates content relevant to the specific business.
**Depends on**: Phase 5, Phase 7
**Research**: Unlikely (extending existing Gemini integration patterns)
**Plans**: 2 plans

Plans:
- [x] 08-01: Dynamic system prompt builder (construct prompt from business profile, active variables, scenario data)
- [x] 08-02: Section prompt adaptation (section-specific prompts that reference business context and relevant variables)

### Phase 9: Sharing & Access
**Goal**: Business owner generates a shareable URL. Any authenticated user who opens the link gets full edit access. The shared business appears in their business list.
**Depends on**: Phase 2
**Research**: Likely (Firestore security rules for multi-tenant sharing, URL-based access granting)
**Research topics**: Firestore security rules for shared documents, invite token patterns, dynamic access control without server functions
**Plans**: 3 plans

Plans:
- [x] 09-01: Data model, security rules, and auth cleanup (viewer role, invite CRUD, rewrite Firestore rules, remove ALLOWED_EMAILS)
- [x] 09-02: Accept invite flow and share dialog UI (AcceptInvite page, /invite route, ShareDialog with role picker and member management)
- [x] 09-03: Read-only viewer enforcement (useBusinessRole hook, disable editing for viewers across all sections/scenarios/AI)

### Phase 10: Dashboard & Navigation
**Goal**: Dashboard shows business-specific KPIs and projections based on that business's variables and scenarios. Sidebar navigation reflects enabled sections. Breadcrumbs include business name.
**Depends on**: Phase 7, Phase 5
**Research**: Unlikely (UI work with established patterns)
**Plans**: 1 plan

Plans:
- [x] 10-01: Smart dashboard rewrite (priority-sorted KPIs, dynamic chart from currency variables, filtered section links with business-scoped URLs)

### Phase 11: Export Updates
**Goal**: PDF export and business plan view work with generic businesses. Cover page shows business name/info. Section rendering adapts to enabled sections and business-specific data.
**Depends on**: Phase 7, Phase 5
**Research**: Unlikely (fixing existing @react-pdf patterns)
**Plans**: 2 plans

Plans:
- [x] 11-01: Business plan view updates (dynamic sections based on business config, generic content rendering)
- [x] 11-02: PDF export fix (dynamic cover page, section-aware document structure, variable-driven financial tables)

### Phase 12: Integration & Polish
**Goal**: End-to-end verification of the full multi-business flow. Fix edge cases, improve error handling, UI polish.
**Depends on**: All previous phases
**Research**: Unlikely (verification and polish)
**Plans**: 6 plans

Plans:
- [x] 12-01: Design system foundation — global CSS tokens, reusable PageHeader/EmptyState/StatCard components
- [x] 12-02: Auth & business management polish — premium login, polished business cards, refined create flow
- [x] 12-03: Dashboard & navigation polish — KPI cards, chart framing, sidebar refinement, layout shell
- [x] 12-04: Section editors part 1 — Executive Summary, Market Analysis, Product/Service, Marketing Strategy
- [x] 12-05: Section editors part 2 — Operations, Financial Projections, Risks, KPIs, Launch Plan
- [x] 12-06: Scenario engine & export polish — scenario modeling tool, business plan view, AI components

</details>

### ✅ v2.0 Production Readiness (Phases 13-16) - SHIPPED 2026-02-18

**Milestone Goal:** Harden the platform for production — secure AI keys behind a backend proxy, make data sync reliable and visible, add tests with CI, and establish observability and operational docs.

#### Phase 13: Observability & Docs
**Goal**: Create a unified logging module for structured error/event logging. Audit .gitignore for leaked secrets. Write operational runbook (local dev, secrets, deploy, pre-release checklist).
**Depends on**: v1.0 complete
**Plans**: 2 plans

Plans:
- [x] 13-01: Logger module, .gitignore fix, lib instrumentation
- [x] 13-02: Operational README

#### Phase 14: Sync Reliability
**Goal**: Replace silent catch blocks with unified sync status (idle/saving/saved/error/offline). Show save indicator in UI. Add retry with exponential backoff for transient failures. Integrate structured logging from Phase 13.
**Depends on**: Phase 13
**Plans**: 4 plans

Plans:
- [x] 14-01: Sync infrastructure (types, atoms, retry utility, SyncStatusIndicator)
- [x] 14-02: useSection refactor with sync status and retry
- [x] 14-03: useScenarioSync + providers.tsx race condition fix
- [x] 14-04: useBusinessVariables + useBusinesses + UI mount

#### Phase 15: Tests & CI
**Goal**: Set up Vitest + Testing Library. Write unit tests for pure logic modules. Add GitHub Actions CI pipeline (lint + test + build).
**Depends on**: Phase 14
**Plans**: 3 plans

Plans:
- [x] 15-01: Vitest setup + formula-engine tests (14 tests)
- [x] 15-02: Infrastructure tests — sync-status, retry, logger (30 tests)
- [x] 15-03: GitHub Actions CI pipeline + lint fixes

#### Phase 16: AI Backend Proxy
**Goal**: Move Gemini and Perplexity API calls behind Firebase Functions. Remove API keys from client-side bundle. Add auth verification, per-user rate limiting, and request timeouts.
**Depends on**: Phase 15
**Plans**: 2 plans

Plans:
- [x] 16-01: Firebase Functions project + 3 proxy endpoints (auth, rate limiting, secrets)
- [x] 16-02: Client refactor — proxy-fetch helper, remove @google/genai, clean env vars

### v3.0 Section Enhancements (Phases 17+)

**Milestone Goal:** Evolve section editors from package/tier-oriented UI to generic, descriptive offering-based models. Add rich content capabilities (images, flexible pricing).

#### Phase 17: Generic Product/Service Offerings & Images
**Goal**: Replace tier-based package UI (Starter/Popular/Premium) with a generic Offering model. Each offering has name, description, price, price label, linked add-ons, and optional image. Backward-compatible with existing Firestore `packages` data. Update AI schemas, prompts, and export (web + PDF) to match.
**Depends on**: Phase 16
**Research**: Unlikely (refactoring existing UI and data model)
**Plans**: 6 plans

Plans:
- [x] 17-01: Domain model (Offering/AddOn types) + normalization function with tests
- [x] 17-02: Firebase Storage setup + image upload hook
- [ ] 17-03: Product & Service UI rewrite (offering cards, add-on catalog, multi-select linking)
- [x] 17-04: AI schema + prompts update + industry overlays for product-service
- [ ] 17-05: Offering image upload UI (upload/preview/replace/remove)
- [ ] 17-06: Export update (web + PDF) + final verification

**Details:**

Key changes:
1. **Domain model**: New `Offering` entity (id, name, description, price, priceLabel, addOnIds, image) replaces `Package`. Enhanced `AddOn` (id, name, description, price, priceLabel). Top-level `overview` field.
2. **Backward compatibility**: Read-path normalizes old `packages` format to `offerings`. Write-path saves new format only.
3. **UI**: Remove all tier styling/icons/labels. Neutral offering cards with add-on multi-select. Image upload/preview/replace/remove per offering.
4. **AI**: Updated schemas and prompts for offering-based generation. No tier terminology.
5. **Export**: Web and PDF export updated for offering model with images.
6. **Storage**: Firebase Storage for offering images (jpg/png/webp, max 5MB). Metadata only in Firestore document.

## Progress

**Execution Order:**
- v1.0: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
- v2.0: 13 → 14 → 15 → 16
- v3.0: 17

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Firestore Data Model | v1.0 | 2/2 | Complete | 2026-02-11 |
| 2. Business CRUD | v1.0 | 5/5 | Complete | 2026-02-11 |
| 3. Dynamic Business Context | v1.0 | 2/2 | Complete | 2026-02-11 |
| 4. Strip Hardcoded Content | v1.0 | 3/3 | Complete | 2026-02-12 |
| 5. Business Profile & Section Config | v1.0 | 2/2 | Complete | 2026-02-12 |
| 6. Variable Library | v1.0 | 4/4 | Complete | 2026-02-12 |
| 7. Generic Scenario Engine | v1.0 | 4/4 | Complete | 2026-02-12 |
| 8. Business-Aware AI | v1.0 | 2/2 | Complete | 2026-02-12 |
| 9. Sharing & Access | v1.0 | 3/3 | Complete | 2026-02-12 |
| 10. Dashboard & Navigation | v1.0 | 1/1 | Complete | 2026-02-11 |
| 11. Export Updates | v1.0 | 2/2 | Complete | 2026-02-12 |
| 12. Integration & Polish | v1.0 | 6/6 | Complete | 2026-02-12 |
| 13. Observability & Docs | v2.0 | 2/2 | Complete | 2026-02-18 |
| 14. Sync Reliability | v2.0 | 4/4 | Complete | 2026-02-18 |
| 15. Tests & CI | v2.0 | 3/3 | Complete | 2026-02-18 |
| 16. AI Backend Proxy | v2.0 | 2/2 | Complete | 2026-02-18 |
| 17. Generic Product/Service Offerings & Images | v3.0 | 4/6 | In progress | - |
