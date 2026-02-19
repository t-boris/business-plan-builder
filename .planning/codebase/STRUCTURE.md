# Codebase Structure

**Analysis Date:** 2026-02-11

## Directory Layout

```
my-business-planning/
├── public/                    # Static assets
│   └── favicon.svg
├── src/                       # Application source
│   ├── app/                   # App shell (router, layout, providers)
│   ├── features/              # Feature modules
│   │   ├── auth/              # Authentication (login)
│   │   ├── dashboard/         # Main dashboard with KPIs
│   │   ├── export/            # Business plan view + PDF export
│   │   │   └── pdf/           # PDF components and generation
│   │   ├── scenarios/         # Scenario management + comparison
│   │   └── sections/          # 9 business plan sections
│   │       ├── executive-summary/
│   │       ├── market-analysis/
│   │       ├── product-service/
│   │       ├── marketing-strategy/
│   │       ├── operations/
│   │       ├── financial-projections/
│   │       ├── risks-due-diligence/
│   │       ├── kpis-metrics/
│   │       └── launch-plan/
│   ├── components/            # Shared UI components
│   │   └── ui/                # shadcn/Radix primitives
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and services
│   │   └── ai/                # AI integration (Gemini, Perplexity)
│   ├── store/                 # Jotai atoms (state management)
│   └── types/                 # TypeScript type definitions
├── dist/                      # Build output (gitignored)
├── index.html                 # HTML entry point
├── vite.config.ts             # Vite build config
├── tsconfig.json              # TS config (references)
├── tsconfig.app.json          # App TS config (strict)
├── tsconfig.node.json         # Node TS config (build tools)
├── eslint.config.js           # ESLint flat config
├── firebase.json              # Firebase hosting + emulator config
├── firestore.rules            # Firestore security rules
├── package.json               # Dependencies and scripts
└── .env.example               # Environment variable template
```

## Directory Purposes

**src/app/**
- Purpose: Application shell - routing, layout, providers
- Contains: `App.tsx`, `router.tsx`, `providers.tsx`, `layout.tsx`
- Key files: `router.tsx` (all route definitions with auth guard), `providers.tsx` (Jotai + Router + Auth + ScenarioSync)

**src/features/**
- Purpose: Feature modules organized by business domain
- Contains: Self-contained feature directories
- Pattern: Each feature has `index.tsx` as entry point

**src/features/sections/**
- Purpose: 9 business plan section editors (each follows identical pattern)
- Contains: 9 directories, each with `index.tsx`
- Pattern: Uses `useSection(slug, defaults)` + `useAiSuggestion(slug)` hooks, renders Card-based forms

**src/features/scenarios/**
- Purpose: Scenario management (create, switch, compare, edit variables)
- Contains: `index.tsx`, `scenario-manager.tsx`, `scenario-dashboard.tsx`, `scenario-controls.tsx`, `scenario-comparison.tsx`

**src/features/export/**
- Purpose: Read-only business plan view and PDF export
- Contains: `index.tsx`, `business-plan-view.tsx`, `pdf/` subdirectory
- Key files: `pdf/BusinessPlanDocument.tsx` (main PDF), `pdf/generatePdf.ts` (trigger download)

**src/features/dashboard/**
- Purpose: Overview dashboard with KPI cards and projection chart
- Contains: `index.tsx`

**src/features/auth/**
- Purpose: Authentication page
- Contains: `login-page.tsx` (Google sign-in with email allowlist)

**src/components/**
- Purpose: Shared reusable components
- Contains: `app-sidebar.tsx`, `ai-action-bar.tsx`, `ai-suggestion-preview.tsx`, `ai-field-trigger.tsx`
- Subdirectory: `ui/` (12+ shadcn/Radix primitives: button, card, input, select, tabs, etc.)

**src/hooks/**
- Purpose: Custom React hooks encapsulating business logic
- Contains: `use-section.ts`, `use-ai-suggestion.ts`, `use-field-ai.ts`, `use-scenario-sync.ts`, `use-auth.ts`, `use-market-research.ts`, `use-mobile.ts`

**src/lib/**
- Purpose: Utility functions and service integrations
- Contains: `firebase.ts`, `firestore.ts`, `constants.ts`, `utils.ts`
- Subdirectory: `ai/` (Gemini client, Perplexity client, prompts, context builder, system prompt)

**src/store/**
- Purpose: Jotai atoms for global state management
- Contains: `auth-atoms.ts`, `plan-atoms.ts`, `scenario-atoms.ts`, `derived-atoms.ts`

**src/types/**
- Purpose: TypeScript type definitions for all business domains
- Contains: `index.ts` (re-exports), `plan.ts` (9 section types), `scenario.ts` (scenario + metrics types), `business.ts` (multi-business data model types)

## Key File Locations

**Entry Points:**
- `index.html` - Browser HTML entry
- `src/main.tsx` - React root mount
- `src/app/App.tsx` - Root component
- `src/app/router.tsx` - Route definitions

**Configuration:**
- `vite.config.ts` - Build config with `@/` alias
- `tsconfig.app.json` - TypeScript strict config
- `eslint.config.js` - Linting rules
- `firebase.json` - Firebase hosting + emulator
- `.env.example` - Environment variable template

**Core Logic:**
- `src/lib/firestore.ts` - All Firestore CRUD operations
- `src/lib/constants.ts` - Default values, packages, KPI targets
- `src/store/scenario-atoms.ts` - Scenario state (primitive atoms)
- `src/store/derived-atoms.ts` - Computed metrics (revenue, profit, etc.)
- `src/hooks/use-section.ts` - Generic section load/save hook

**AI Integration:**
- `src/lib/ai/gemini-client.ts` - Gemini API wrapper
- `src/lib/ai/perplexity-client.ts` - Perplexity API wrapper
- `src/lib/ai/section-prompts.ts` - 9 section prompts + Zod schemas
- `src/lib/ai/context-builder.ts` - Prompt context assembly
- `src/lib/ai/system-prompt.ts` - Global AI system instruction

**Testing:**
- No test files exist in the codebase

## Naming Conventions

**Files:**
- kebab-case.tsx for React components: `app-sidebar.tsx`, `login-page.tsx`
- kebab-case.ts for hooks with `use-` prefix: `use-section.ts`, `use-auth.ts`
- kebab-case.ts for utilities: `gemini-client.ts`, `context-builder.ts`
- kebab-case.ts for store with `-atoms` suffix: `plan-atoms.ts`, `scenario-atoms.ts`
- PascalCase.tsx for PDF components: `BusinessPlanDocument.tsx`, `CoverPage.tsx`
- `index.tsx` for feature module entry points

**Directories:**
- kebab-case for all directories: `market-analysis/`, `risks-due-diligence/`
- Singular for conceptual modules: `store/`, `lib/`

**Special Patterns:**
- `index.tsx` as barrel export for feature modules
- `ui/` directory for shadcn component primitives

## Where to Add New Code

**New Business Plan Section:**
- Component: `src/features/sections/{slug}/index.tsx`
- Types: Add interface to `src/types/plan.ts`
- Defaults: Add to `src/lib/constants.ts`
- AI prompt: Add to `src/lib/ai/section-prompts.ts`
- Route: Add to `src/app/router.tsx`
- Sidebar: Add to `src/components/app-sidebar.tsx`

**New Feature Module:**
- Component: `src/features/{name}/index.tsx`
- Route: Add to `src/app/router.tsx`
- Sidebar: Add to `src/components/app-sidebar.tsx`

**New Hook:**
- Implementation: `src/hooks/use-{name}.ts`

**New Atom/Store:**
- Implementation: `src/store/{domain}-atoms.ts`

**New UI Component:**
- Shared: `src/components/{name}.tsx`
- Primitive: `src/components/ui/{name}.tsx`

**Utilities:**
- Shared helpers: `src/lib/{name}.ts`
- Type definitions: `src/types/{name}.ts`

## Special Directories

**dist/**
- Purpose: Vite build output
- Source: Generated by `npm run build`
- Committed: No (should be gitignored)

**.planning/**
- Purpose: Project planning documents (GSD system)
- Source: Created by planning tools
- Committed: Yes

---

*Structure analysis: 2026-02-11*
*Update when directory structure changes*
