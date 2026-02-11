# Coding Conventions

**Analysis Date:** 2026-02-11

## Naming Patterns

**Files:**
- kebab-case for all source files: `use-section.ts`, `gemini-client.ts`, `scenario-atoms.ts`
- PascalCase exception for PDF components: `BusinessPlanDocument.tsx`, `CoverPage.tsx`
- `use-` prefix for hooks: `use-section.ts`, `use-ai-suggestion.ts`, `use-auth.ts`
- `-atoms` suffix for store files: `plan-atoms.ts`, `scenario-atoms.ts`, `derived-atoms.ts`
- `index.tsx` as entry point for feature modules

**Functions:**
- camelCase for all functions: `updateField`, `saveSection`, `generateStructuredContent`
- `handle` prefix for event handlers: `handleClick`, `handleSubmit`
- `use` prefix for hooks: `useSection`, `useAiSuggestion`, `useScenarioSync`

**Variables:**
- camelCase for variables: `currentPlanId`, `monthlyLeads`, `isLoading`
- UPPER_SNAKE_CASE for constants: `SEASON_PRESET_MIAMI_KIDS`, `COST_PER_EVENT_LABOR`, `MONTHLY_FIXED`
- `Atom` suffix for Jotai atoms: `priceStarterAtom`, `monthlyRevenueAtom`, `authStateAtom`

**Types:**
- PascalCase for interfaces, no `I` prefix: `ExecutiveSummary`, `MarketAnalysis`, `Scenario`
- PascalCase for type aliases: `SectionSlug`, `RiskCategory`, `MarketingChannelName`
- String literal unions for enums: `type SectionSlug = 'executive-summary' | 'market-analysis' | ...`
- kebab-case values in union types: `'meta-ads' | 'google-ads' | 'organic-social'`

## Code Style

**Formatting:**
- No Prettier config (relies on ESLint rules)
- 2-space indentation
- Double quotes for imports and strings
- Semicolons required
- No strict line length enforcement (long JSX lines common)

**Linting:**
- ESLint 9.x flat config: `eslint.config.js`
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended
- Plugins: `react-hooks`, `react-refresh`
- Run: `npm run lint` -> `eslint .`
- No pre-commit hooks (no husky/lint-staged)

## Import Organization

**Order:**
1. React and external packages (`react`, `react-router`, `jotai`, `firebase`)
2. Internal modules via alias (`@/lib/`, `@/store/`, `@/components/`)
3. Relative imports (`./utils`, `../types`)
4. Type imports mixed in (no separate `import type` convention)

**Grouping:**
- No enforced blank lines between groups
- Alphabetical order not enforced

**Path Aliases:**
- `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)
- Used consistently throughout codebase

## Error Handling

**Patterns:**
- Silent try/catch at persistence boundaries (Firestore reads/writes)
- Empty catch blocks: `catch { }` in `src/app/providers.tsx`, `src/hooks/use-section.ts`
- AI hooks expose error state to UI (loading/error/preview)
- No custom error classes

**Error Types:**
- Firestore failures silently swallowed (app continues with local state)
- AI API failures shown as error messages in suggestion UI
- No global error boundary

## Logging

**Framework:**
- No logging framework (console.log/error only)
- Minimal logging in production code

**Patterns:**
- No structured logging
- console.error for caught exceptions (occasionally)

## Comments

**When to Comment:**
- Inline comments for Firestore path documentation: `// Firestore path: plans/{planId}/sections/{sectionSlug}`
- Calculation explanations: `// Variable costs per event`
- Type file headers: `// All interfaces are serializable (no methods) for Firestore compatibility.`

**JSDoc/TSDoc:**
- Minimal usage; relies on TypeScript for documentation
- Occasional: `/** Generate free-text content using Gemini. */` in `src/lib/ai/gemini-client.ts`
- Zod schema `describe()` as documentation in `src/lib/ai/section-prompts.ts`

**TODO Comments:**
- Not widely used in current codebase

## Function Design

**Size:**
- Most utility functions short (<30 lines)
- Section components large (300-1000+ lines) due to form rendering
- No enforced size limit

**Parameters:**
- Destructured objects for hook returns: `{ data, updateField, updateData, isLoading }`
- Simple parameters for service functions: `saveSection(planId, slug, data)`

**Return Values:**
- Hooks return typed objects
- Firestore functions return void or data
- Early returns for guard clauses

## Module Design

**Exports:**
- Named exports preferred: `export function AppSidebar() { ... }`
- No default exports
- Feature modules export via `index.tsx`

**Barrel Files:**
- `src/types/index.ts` re-exports all types
- Feature modules use `index.tsx` as entry point
- No barrel files for hooks or store

## Component Patterns

**React Patterns:**
- Functional components only (no class components)
- `useAtom()` / `useAtomValue()` / `useSetAtom()` for state access
- `useCallback` for memoized handlers
- `useRef` for debounce timers
- `useEffect` for lifecycle (mount, cleanup, side effects)

**Component Structure:**
- Props interface defined inline above component
- Hooks at top of component body
- Event handlers after hooks
- JSX return at bottom

**Styling:**
- Tailwind utility classes directly in JSX
- `cn()` helper for conditional classes (`src/lib/utils.ts`)
- CVA for component variants (shadcn pattern)

---

*Convention analysis: 2026-02-11*
*Update when patterns change*
