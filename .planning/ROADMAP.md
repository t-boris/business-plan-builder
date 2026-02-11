# Roadmap: Fun Box Planning

## Overview

Build a Firebase-hosted business planning dashboard (React + TypeScript) for the Fun Box kids birthday party service. Start with project foundation and dashboard shell, then build out all 9 business plan section UIs with pre-populated data, add interactive what-if scenario modeling that propagates changes across sections in real time, and finish with Gemini 2.5 Pro AI assistance and polished business plan export (in-app + PDF).

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** — React + TS + Firebase setup, dashboard shell, routing, Firestore data model
- [x] **Phase 2: Business Plan Sections** — All 9 section UIs with forms, pre-populated data, deep research integration
- [ ] **Phase 3: What-If Engine** — Scenario modeling with real-time calculation propagation and comparison
- [ ] **Phase 4: AI + Export** — Gemini 2.5 Pro per-section AI, business plan view, PDF export

## Phase Details

### Phase 1: Foundation
**Goal**: Working dashboard shell deployed to Firebase with sidebar navigation, routing between sections, Firestore connection, and base component library (inputs, cards, charts)
**Depends on**: Nothing (first phase)
**Research**: Likely (Firebase + Vite + React project setup, Firestore schema design for nested business plan data)
**Research topics**: Vite + React + TypeScript + Firebase Hosting setup, Firestore data modeling for document-heavy apps, chart library selection (e.g., Recharts vs Chart.js)
**Plans**: 3 plans

Plans:
- [x] 01-01: Project scaffolding (Vite + React + TS + Firebase), Firestore config, deploy pipeline
- [x] 01-02: Dashboard layout (sidebar nav, header, content area), routing for all 9 sections
- [x] 01-03: Base component library (form inputs, cards, data tables, chart wrapper) + Firestore data model

### Phase 2: Business Plan Sections
**Goal**: All 9 business plan sections fully functional with editable forms, pre-populated with known Fun Box data (packages, KPIs, marketing channels, research findings), auto-saving to Firestore
**Depends on**: Phase 1
**Research**: Unlikely (standard React form patterns, internal UI work)
**Plans**: 3 plans

Plans:
- [x] 02-01: Product/Service + Market Analysis + KPIs sections (packages data, Miami demographics, competitive benchmarks, target metrics)
- [x] 02-02: Marketing Strategy + Operations + Launch Plan sections (channels, budgets, crew, capacity, 3-stage launch timeline)
- [x] 02-03: Financial Projections + Risks & Due Diligence + Executive Summary sections (P&L, unit economics, research report integration, auto-generated summary)

### Phase 3: What-If Engine
**Goal**: Interactive scenario modeling where changing any variable (pricing, CAC, conversion, capacity, costs, ad budgets) propagates through all dependent sections in real time, with scenario save/load and side-by-side comparison
**Depends on**: Phase 2
**Research**: Unlikely (internal calculation logic, React state management)
**Plans**: 2 plans

Plans:
- [ ] 03-01: Calculation engine (dependency graph between variables, real-time propagation), scenario CRUD (create, save, load, delete)
- [ ] 03-02: Side-by-side scenario comparison UI, variable sliders/inputs per section, visual diff highlighting

### Phase 4: AI + Export
**Goal**: Gemini 2.5 Pro "Ask AI" button per section (contextual — sees section data + business context), polished in-app business plan read-only view, and PDF export with professional formatting
**Depends on**: Phase 3
**Research**: Likely (Gemini 2.5 Pro API — current endpoints, auth, context window; PDF generation library)
**Research topics**: Gemini 2.5 Pro API (authentication, chat/generate endpoints, context handling), PDF generation in React (react-pdf, jsPDF, or Puppeteer-based), prompt engineering for business plan content generation
**Plans**: 2 plans

Plans:
- [ ] 04-01: Gemini 2.5 Pro integration (API setup, per-section "Ask AI" with contextual prompts, inline response display)
- [ ] 04-02: Business plan read-only view (polished layout), PDF export (professional formatting, all sections + selected scenario)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-02-11 |
| 2. Business Plan Sections | 3/3 | Complete | 2026-02-11 |
| 3. What-If Engine | 0/2 | Not started | - |
| 4. AI + Export | 0/2 | Not started | - |
