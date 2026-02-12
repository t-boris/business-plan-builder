# Roadmap: Business Planning Platform

## Overview

Transform a single-business Fun Box planning app into a generic multi-business platform. The journey goes: new data model → business management → strip hardcoded content → generic configuration → dynamic scenario engine → AI adaptation → sharing → polish. The financial calculator and scenario modeling are the core value; text sections are secondary. Every phase must preserve the existing architecture patterns (Jotai atoms, useSection hook, feature modules) while making them business-aware.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Firestore Data Model** - New multi-business data structure, TypeScript types, Firestore service layer
- [x] **Phase 2: Business CRUD** - Create, list, switch, delete businesses with selector UI
- [x] **Phase 3: Dynamic Business Context** - Replace hardcoded plan ID, wire atoms/hooks/routing to active business
- [x] **Phase 4: Strip Hardcoded Content** - Remove Fun Box from 12+ files, create generic defaults system
- [x] **Phase 5: Business Profile & Section Config** - Business profile editor, configurable sections per business
- [x] **Phase 6: Variable Library** - Predefined business variables organized by business type
- [ ] **Phase 7: Generic Scenario Engine** - Dynamic atoms from variable library, adaptive derived metrics
- [ ] **Phase 8: Business-Aware AI** - Dynamic system prompt and section prompts from business context
- [ ] **Phase 9: Sharing & Access** - Shareable URLs, access granting, multi-user business list
- [ ] **Phase 10: Dashboard & Navigation** - Multi-business dashboard, updated sidebar and breadcrumbs
- [ ] **Phase 11: Export Updates** - Fix PDF export and business plan view for generic businesses
- [ ] **Phase 12: Integration & Polish** - End-to-end verification, edge cases, UI polish

## Phase Details

### Phase 1: Firestore Data Model
**Goal**: Design and implement the new multi-business Firestore document structure and TypeScript types. This is the foundation everything else builds on.
**Depends on**: Nothing (first phase)
**Research**: Unlikely (Firestore patterns already established in codebase)
**Plans**: 2 plans

Plans:
- [x] 01-01: Define TypeScript types and interfaces for multi-business data model (Business, BusinessConfig, BusinessProfile)
- [ ] 01-02: Implement new Firestore service layer (business CRUD operations, section/scenario paths scoped to business)

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
- [ ] 07-04: Comparison, main dashboard, and legacy cleanup (rewrite remaining consumers, remove all hardcoded atoms/types)

### Phase 8: Business-Aware AI
**Goal**: AI system prompt dynamically built from business profile (name, type, location, context). Section prompts adapt to the business type and its selected variables. AI generates content relevant to the specific business.
**Depends on**: Phase 5, Phase 7
**Research**: Unlikely (extending existing Gemini integration patterns)
**Plans**: 2 plans

Plans:
- [ ] 08-01: Dynamic system prompt builder (construct prompt from business profile, active variables, scenario data)
- [ ] 08-02: Section prompt adaptation (section-specific prompts that reference business context and relevant variables)

### Phase 9: Sharing & Access
**Goal**: Business owner generates a shareable URL. Any authenticated user who opens the link gets full edit access. The shared business appears in their business list.
**Depends on**: Phase 2
**Research**: Likely (Firestore security rules for multi-tenant sharing, URL-based access granting)
**Research topics**: Firestore security rules for shared documents, invite token patterns, dynamic access control without server functions
**Plans**: 2 plans

Plans:
- [ ] 09-01: Sharing data model and URL generation (share tokens in Firestore, generate/revoke share links)
- [ ] 09-02: Accept share flow and access enforcement (open link → add to user's business list, Firestore rules for shared access)

### Phase 10: Dashboard & Navigation
**Goal**: Dashboard shows business-specific KPIs and projections based on that business's variables and scenarios. Sidebar navigation reflects enabled sections. Breadcrumbs include business name.
**Depends on**: Phase 7, Phase 5
**Research**: Unlikely (UI work with established patterns)
**Plans**: 2 plans

Plans:
- [ ] 10-01: Multi-business dashboard (KPI cards and charts driven by business's active variables and derived metrics)
- [ ] 10-02: Sidebar and navigation updates (business name in header, section list from business config, breadcrumbs)

### Phase 11: Export Updates
**Goal**: PDF export and business plan view work with generic businesses. Cover page shows business name/info. Section rendering adapts to enabled sections and business-specific data.
**Depends on**: Phase 7, Phase 5
**Research**: Unlikely (fixing existing @react-pdf patterns)
**Plans**: 2 plans

Plans:
- [ ] 11-01: Business plan view updates (dynamic sections based on business config, generic content rendering)
- [ ] 11-02: PDF export fix (dynamic cover page, section-aware document structure, variable-driven financial tables)

### Phase 12: Integration & Polish
**Goal**: End-to-end verification of the full multi-business flow. Fix edge cases, improve error handling, UI polish.
**Depends on**: All previous phases
**Research**: Unlikely (verification and polish)
**Plans**: 2 plans

Plans:
- [ ] 12-01: End-to-end flow verification (create business → configure → scenario modeling → AI generation → export)
- [ ] 12-02: UI polish and edge cases (empty states, loading states, error handling, offline behavior)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

Note: Phase 6 can start in parallel with Phases 2-5 (depends only on Phase 1).
Phase 9 can start after Phase 2 (independent of Phases 3-8).

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Firestore Data Model | 2/2 | Complete | 2026-02-11 |
| 2. Business CRUD | 5/5 | Complete | 2026-02-11 |
| 3. Dynamic Business Context | 2/2 | Complete | 2026-02-11 |
| 4. Strip Hardcoded Content | 3/3 | Complete | 2026-02-12 |
| 5. Business Profile & Section Config | 2/2 | Complete | 2026-02-12 |
| 6. Variable Library | 4/4 | Complete | 2026-02-12 |
| 7. Generic Scenario Engine | 3/4 | In progress | - |
| 8. Business-Aware AI | 0/2 | Not started | - |
| 9. Sharing & Access | 0/2 | Not started | - |
| 10. Dashboard & Navigation | 0/2 | Not started | - |
| 11. Export Updates | 0/2 | Not started | - |
| 12. Integration & Polish | 0/2 | Not started | - |
