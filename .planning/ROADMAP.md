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

**Milestone Goal:** Evolve section editors and scenario engine into a full-featured business planning platform. Generic offering model, advanced scenario composition with section variants, comparison/decision matrix, and AI-aware scenario context.

#### Phase 17: Generic Product/Service Offerings & Images
**Goal**: Replace tier-based package UI (Starter/Popular/Premium) with a generic Offering model. Each offering has name, description, price, price label, linked add-ons, and optional image. Backward-compatible with existing Firestore `packages` data. Update AI schemas, prompts, and export (web + PDF) to match.
**Depends on**: Phase 16
**Research**: Unlikely (refactoring existing UI and data model)
**Plans**: 6 plans

Plans:
- [x] 17-01: Domain model (Offering/AddOn types) + normalization function with tests
- [x] 17-02: Firebase Storage setup + image upload hook
- [x] 17-03: Product & Service UI rewrite (offering cards, add-on catalog, multi-select linking)
- [x] 17-04: AI schema + prompts update + industry overlays for product-service
- [x] 17-05: Offering image upload UI (upload/preview/replace/remove)
- [x] 17-06: Export update (web + PDF) + final verification

**Details:**

Key changes:
1. **Domain model**: New `Offering` entity (id, name, description, price, priceLabel, addOnIds, image) replaces `Package`. Enhanced `AddOn` (id, name, description, price, priceLabel). Top-level `overview` field.
2. **Backward compatibility**: Read-path normalizes old `packages` format to `offerings`. Write-path saves new format only.
3. **UI**: Remove all tier styling/icons/labels. Neutral offering cards with add-on multi-select. Image upload/preview/replace/remove per offering.
4. **AI**: Updated schemas and prompts for offering-based generation. No tier terminology.
5. **Export**: Web and PDF export updated for offering model with images.
6. **Storage**: Firebase Storage for offering images (jpg/png/webp, max 5MB). Metadata only in Firestore document.

#### Phase 18: Advanced Scenario Engine
**Goal**: Evolve the scenario system from simple numeric overrides to a full decision-support tool. Scenarios gain assumptions, section variants (alternative product/ops/marketing configurations), comparison matrix with weighted scoring, and AI awareness of the active scenario context. Backward-compatible with existing values-only scenarios.
**Depends on**: Phase 17
**Research**: Likely (effective plan composition, section variant architecture, dynamic Jotai atom merging)
**Research topics**: Section variant data model, effective plan merge strategies, weighted decision matrix algorithms, scenario-aware AI context injection
**Plans**: 8 plans

Plans:
- [x] 18-01: Data model v2 + backward compatibility (assumptions, variantRefs, sectionOverrides, status, horizonMonths)
- [x] 18-02: Effective scenario engine (composition layer: base + variants + overrides)
- [x] 18-03: Scenario Editor UI (tabs: Assumptions, Levers, Section Variants, Compare, Decision)
- [x] 18-04: Section variants for key tabs (product-service, operations, marketing-strategy)
- [x] 18-05: Comparison + Decision Matrix (risk/timeline/regulatory comparison, weighted score, recommendations)
- [x] 18-06: AI scenario-aware (context-builder + use-ai-suggestion with active scenario/assumptions/variants)
- [x] 18-07: Export scenario pack (Base + Scenarios appendix + Comparison table + Decision summary)
- [x] 18-08: Tests & quality (merge logic, migration, lint/test/build verification)

**Details:**

Key changes:
1. **Data model v2**: Scenario gains `assumptions` (text), `variantRefs` (per-section variant pointers), `sectionOverrides` (partial section data), `status` (draft/active/archived), `horizonMonths`. Legacy values-only scenarios load without migration.
2. **Effective plan composition**: New `effective-plan.ts` module computes the "effective" business plan by merging: base section data + selected variants + scenario overrides + numeric variable overrides.
3. **Scenario Editor UI**: Tabbed interface — Assumptions (text/structured), Levers (numeric variables), Section Variants (pick alternative configs per section), Compare (side-by-side), Decision (verdict/recommendation).
4. **Section variants**: Product-service, operations, and marketing-strategy sections support per-scenario variants. Each variant is a full or partial section snapshot selectable within a scenario.
5. **Comparison + Decision Matrix**: Extend comparison beyond KPIs to include risks, timelines, regulatory requirements. Weighted scoring system with rule-based recommendation engine.
6. **AI scenario-aware**: AI context builder injects active scenario assumptions, selected variants, and overrides so AI suggestions are scenario-contextual.
7. **Export**: Business plan export includes base plan + scenarios appendix + comparison table + decision summary.
8. **Testing**: Merge logic tests, legacy migration tests, full build/lint/test verification.

#### Phase 19: Granular Field-Level AI Generation
**Goal**: Replace whole-tab AI generation with field-specific AI calls. Each text field (descriptions, overviews, tactics, mitigations) gets its own AI trigger that generates only that field using the rest of the section as context. Whole-tab Generate remains as fallback for empty sections.
**Depends on**: Phase 18
**Research**: Likely (per-field prompt design, partial schema output, UX for inline AI triggers)
**Research topics**: Field-level AI trigger UX patterns, partial Zod schema generation, context windowing for single-field prompts
**Plans**: 2 plans

Plans:
- [x] 19-01: Field-level AI infrastructure (useFieldAi hook, buildFieldPrompt, AiFieldTrigger component)
- [x] 19-02: Wire AiFieldTrigger into section editors

**Details:**

Key changes:
1. **Infrastructure**: `useFieldAi` hook (lightweight, returns string directly), `buildFieldPrompt` (XML-tagged field-scoped prompt), `AiFieldTrigger` component (sparkle icon, auto-detect generate/improve)
2. **Section wiring**: 11 AiFieldTrigger instances across executive-summary (3), product-service (2 types), marketing-strategy (2 types), market-analysis (1), risks-due-diligence (3 types)
3. **UX**: Triggers visible only to editors (canEdit && !isPreview), whole-tab AI remains fully functional alongside field-level triggers

#### Phase 20: Generic Industry-Agnostic Operations
**Goal**: Rewrite the Operations section with a single generic data model that works for all business types. Remove event-specific and manufacturing-specific fields/UI. Manufacturing modeled entirely through generic capacity, cost items, and operational metrics. Migration from old event-based model with backward compatibility.
**Depends on**: Phase 19
**Research**: Unlikely (refactoring existing data model and UI)
**Plans**: 4 plans

Plans:
- [x] 20-01: Data model v2 + normalizeOperations + computeOperationsCosts (Wave 1)
- [x] 20-02: UI rewrite — tabbed/sectioned generic editor (Wave 2)
- [x] 20-03: AI schema + prompts rewrite for generic model (Wave 2)
- [x] 20-04: Export update (web + PDF) + tests (Wave 2)

**Details:**

**Generic Operations model (no industry-specific fields):**
- `workforce[]` (role, count, ratePerHour)
- `capacity` (outputUnitLabel, plannedOutputPerMonth, maxOutput, utilizationRate)
- `costItems[]` (type: variable|fixed, category, rate, driverType: per-unit|per-order|per-service-hour|per-machine-hour|monthly|quarterly|yearly, driverQuantityPerMonth)
- `equipment[]`, `safetyProtocols[]`
- `operationalMetrics[]` (generic KPI: name, unit, value, target — e.g. yield rate, scrap rate, OEE for manufacturing)

**Calculations:**
- variableMonthlyTotal = Σ(variable rate × driverQuantityPerMonth)
- fixedMonthlyTotal = Σ(fixed rate normalized to month)
- monthlyOperationsTotal = variableMonthlyTotal + fixedMonthlyTotal
- variableCostPerOutput = variableMonthlyTotal / plannedOutputPerMonth

**UI:** Single universal editor — Team, Capacity, Variable Costs, Fixed Costs, Equipment, Safety, Operational Metrics. No conditional renders per business type.

**AI:** One schema for all business types. Manufacturing AI fills the same generic schema via cost items + operational metrics.

**Migration:** Old event-model maps to generic costItems. Backward compatibility required.

**Acceptance criteria:** No manufacturing-specific fields, no event-specific terms. Manufacturing fully modeled through generic capacity/cost/metrics. Export/PDF uses the same generic structure.

#### Phase 21: Rich Growth Events
**Goal**: Expand the Growth Timeline from 5 atomic event types to a rich library of compound event templates tied to real financial calculations. Support funding rounds, facility builds, hiring campaigns, revenue events, and duration-based events. Each compound template decomposes into atomic deltas (hire, cost-change, capacity-change, marketing-change) so the existing compute engine works unchanged. Business-type-aware event suggestions.
**Depends on**: Phase 20
**Research**: Likely (compound event decomposition patterns, business-type-specific event catalogs)
**Research topics**: Startup financial model milestones, compound event templates, duration-based event modeling, funding round financial impact
**Plans**: 1 plan

Plans:
- [x] 21-01: Rich growth event types + duration-aware compute engine (6 new delta interfaces, 4 temporal patterns, 8 tests)
- [x] 21-02: Rich growth events UI (form fields, event card display, AI prompts for all 11 event types)

**Details:**
[To be added during planning]

#### Phase 22: JSON Import/Export for Business Plans
**Goal**: Allow users to export a complete business plan (all sections, scenarios, variables) as a JSON file for local backup, and import a JSON file to restore or clone a business plan. Accessible from business settings or sidebar.
**Depends on**: Phase 21
**Research**: Unlikely (straightforward data serialization)
**Plans**: 1 plan

Plans:
- [x] 22-01: JSON import/export utility + UI in business switcher dropdown

**Details:**
BusinessExportBundle format (version 1.0): profile, enabledSections, sections (raw Firestore data), variables, scenarios. Export Data downloads complete snapshot, Export Schema downloads JSON Schema (draft-07), Import validates and overwrites. Owner-only access in business switcher dropdown.

#### Phase 23: PDF Export Language Translation
**Goal**: Add a target language selector to the PDF export flow. When the selected language differs from the source language, use AI to translate each section's text content before generating the PDF. Translations happen on-the-fly during PDF generation, not stored permanently. Supports all major business plan languages (English, Spanish, French, German, Russian, Chinese, Japanese, etc.).
**Depends on**: Phase 22
**Research**: Likely (AI translation prompt design, section text extraction for PDF pipeline, batch translation before render)
**Research topics**: Per-section translation prompt structure, preserving markdown/formatting during translation, PDF generation pipeline integration points, translation caching strategy
**Plans**: 2 plans

Plans:
- [x] 23-01: Translation Cloud Function endpoint + client utility (Wave 1)
- [ ] 23-02: Language selector UI + PDF translation integration (Wave 2)

**Details:**
[To be added during planning]

## Progress

**Execution Order:**
- v1.0: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
- v2.0: 13 → 14 → 15 → 16
- v3.0: 17 → 18 → 19 → 20 → 21 → 22 → 23

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
| 17. Generic Product/Service Offerings & Images | v3.0 | 6/6 | Complete | 2026-02-18 |
| 18. Advanced Scenario Engine | v3.0 | 8/8 | Complete | 2026-02-19 |
| 19. Granular Field-Level AI Generation | v3.0 | 2/2 | Complete | 2026-02-19 |
| 20. Generic Industry-Agnostic Operations | v3.0 | 4/4 | Complete | 2026-02-19 |
| 21. Rich Growth Events | v3.0 | 2/2 | Complete | 2026-02-19 |
| 22. JSON Import/Export | v3.0 | 1/1 | Complete | 2026-02-19 |
| 23. PDF Export Language Translation | v3.0 | 1/2 | In progress | — |
