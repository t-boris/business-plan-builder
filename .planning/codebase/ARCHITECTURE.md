# Architecture

**Analysis Date:** 2026-02-11

## Pattern Overview

**Overall:** Client-side React SPA with Feature-Based Organization

**Key Characteristics:**
- Single Page Application (no backend server)
- Feature-based module organization (9 business plan sections as independent modules)
- Jotai atomic state management with derived computations
- Firebase as sole backend (Auth + Firestore)
- AI-first design (every section supports Gemini-powered generation)

## Layers

**Presentation Layer:**
- Purpose: Render UI, handle user interactions
- Contains: React components, forms, charts, PDF export
- Location: `src/features/`, `src/components/`, `src/app/`
- Depends on: State layer, hooks layer
- Used by: End users via browser

**State Management Layer:**
- Purpose: Global state via Jotai atoms + derived computations
- Contains: Primitive atoms (pricing, leads, budgets), derived atoms (revenue, profit, CAC)
- Location: `src/store/plan-atoms.ts`, `src/store/scenario-atoms.ts`, `src/store/derived-atoms.ts`, `src/store/auth-atoms.ts`
- Depends on: Nothing (atoms are self-contained)
- Used by: Presentation layer, hooks layer

**Hooks / Business Logic Layer:**
- Purpose: Encapsulate load/save, AI generation, sync logic
- Contains: `useSection()` (generic CRUD), `useAiSuggestion()` (AI workflow), `useScenarioSync()` (auto-save)
- Location: `src/hooks/`
- Depends on: State layer, data access layer
- Used by: Presentation layer

**AI Integration Layer:**
- Purpose: Content generation and market research
- Contains: Gemini client, Perplexity client, prompt templates, context builder
- Location: `src/lib/ai/`
- Depends on: External APIs (Gemini, Perplexity)
- Used by: Hooks layer (`useAiSuggestion`, `useMarketResearch`)

**Data Access Layer:**
- Purpose: Firebase Auth and Firestore CRUD operations
- Contains: Firebase init, Firestore read/write functions
- Location: `src/lib/firebase.ts`, `src/lib/firestore.ts`
- Depends on: Firebase SDK, external Firestore service
- Used by: Hooks layer

## Data Flow

**Section Edit Flow:**

1. User edits field in section component (e.g., `src/features/sections/executive-summary/index.tsx`)
2. Component calls `updateField(fieldName, value)` from `useSection()` hook
3. Local state updates immediately (optimistic)
4. Hook debounces (500ms) then calls `saveSection(planId, slug, data)` in `src/lib/firestore.ts`
5. Firestore persists document at `plans/{planId}/sections/{sectionSlug}`

**Scenario Variable Change Flow:**

1. User adjusts variable (e.g., pricing slider)
2. Jotai primitive atom updates (e.g., `priceStarterAtom`)
3. Derived atoms auto-recompute (e.g., `monthlyRevenueAtom`, `profitMarginAtom`)
4. All subscribed components re-render with new values
5. `useScenarioSync()` debounces (500ms) and saves to Firestore

**AI Generation Flow:**

1. User clicks "Generate" / "Improve" / "Expand" in `AiActionBar`
2. `useAiSuggestion()` builds prompt via `src/lib/ai/context-builder.ts`
3. Calls `generateStructuredContent()` in `src/lib/ai/gemini-client.ts`
4. Gemini returns JSON matching section's Zod schema
5. Suggestion shown in preview state (`AiSuggestionPreview` component)
6. User accepts or rejects; accepted data merges into section state

**State Management:**
- Jotai atoms as single source of truth for scenario variables
- Firestore as persistence layer (debounced writes)
- No real-time sync from Firestore (load-once on mount, write-on-change)

## Key Abstractions

**Jotai Atom:**
- Purpose: Atomic state unit for scenario variables and app state
- Examples: `priceStarterAtom`, `monthlyLeadsAtom`, `conversionRateAtom`, `authStateAtom`
- Pattern: Primitive atoms + derived read-only atoms

**useSection() Hook:**
- Purpose: Generic CRUD for any business plan section
- Location: `src/hooks/use-section.ts`
- Pattern: Load from Firestore on mount, debounced save on change, returns `{ data, updateField, updateData, isLoading }`

**useAiSuggestion() Hook:**
- Purpose: AI generation workflow (generate/preview/accept/reject)
- Location: `src/hooks/use-ai-suggestion.ts`
- Pattern: State machine (idle -> loading -> preview -> accepted/rejected)

**Section Prompt:**
- Purpose: Section-specific AI prompt template + JSON schema
- Location: `src/lib/ai/section-prompts.ts`
- Pattern: 9 prompt configs with Zod schemas, converted to JSON Schema for Gemini

**Firestore Service:**
- Purpose: Data access functions abstracted from Firebase SDK
- Location: `src/lib/firestore.ts`
- Pattern: Functions like `getSection()`, `saveSection()`, `listScenarios()`, `deleteScenario()`

## Entry Points

**Browser Entry:**
- Location: `index.html` -> `src/main.tsx`
- Triggers: Page load
- Responsibilities: Mount React root, render `<Providers>` -> `<App>` -> `<AppRoutes>`

**Providers:**
- Location: `src/app/providers.tsx`
- Triggers: App initialization
- Responsibilities: JotaiProvider, BrowserRouter, AuthListener (Firebase onAuthStateChanged), ScenarioSync (auto-save)

**Router:**
- Location: `src/app/router.tsx`
- Triggers: URL changes
- Responsibilities: Auth guard, route matching to section/feature components

## Error Handling

**Strategy:** Silent catch with graceful degradation (works offline, syncs when available)

**Patterns:**
- Firestore operations wrapped in try/catch, errors silently swallowed (`src/hooks/use-section.ts`, `src/app/providers.tsx`)
- AI calls show error state in UI (loading/error/preview states in `useAiSuggestion`)
- No global error boundary component
- No user-visible notifications for sync failures

## Cross-Cutting Concerns

**Logging:**
- console.log/error only (no logging framework)
- Minimal logging in production code

**Validation:**
- Zod schemas for AI response validation (`src/lib/ai/section-prompts.ts`)
- No client-side form validation (raw inputs saved directly)

**Authentication:**
- Firebase Auth with Google OAuth + email/password (`src/lib/firebase.ts`)
- Email allowlist in `src/store/auth-atoms.ts`
- Auth guard in router (`src/app/router.tsx`)

**Styling:**
- Tailwind CSS utilities + shadcn/Radix components
- Dark mode support via CSS variables (`src/index.css`)
- `cn()` utility for class merging (`src/lib/utils.ts`)

---

*Architecture analysis: 2026-02-11*
*Update when major patterns change*
