# Codebase Concerns

**Analysis Date:** 2026-02-11

## Tech Debt

**CRITICAL: Hardcoded Business-Specific Content (12+ files):**
- Issue: Entire app is hardcoded for "Fun Box" kids party/ocean workshop business in Miami. Cannot serve any other business.
- Files:
  - `src/lib/constants.ts` - Fun Box packages (Ocean Starter/Explorer/VIP), pricing ($800-$1,200), crew rate ($20/hr), fixed costs ($11,650/mo), KPI targets, marketing channels
  - `src/lib/ai/system-prompt.ts` - Hardcoded "Fun Box," Miami, ocean-themed workshops, Jellyfish Museum
  - `src/features/sections/executive-summary/index.tsx` - Default text mentions Fun Box, Miami, ocean, Jellyfish Museum
  - `src/features/sections/market-analysis/index.tsx` - Miami metro defaults, ocean workshops, competitors (Museum Party Co., Party Bus Miami, Kids Fun Factory)
  - `src/features/sections/product-service/index.tsx` - Party-specific add-ons defaults
  - `src/features/sections/marketing-strategy/index.tsx` - Channel names and tactics for party business
  - `src/features/sections/operations/index.tsx` - Party host/photographer/assistant roles, party bus equipment, slime lab materials, ocean decorations, safety protocols
  - `src/features/sections/financial-projections/index.tsx` - Cost breakdown (labor $254, supplies $75, museum $225, transport $19), Miami kids seasonality preset, month labels Mar 2026-Feb 2027
  - `src/features/sections/risks-due-diligence/index.tsx` - Jellyfish Museum partnership risks, Miami-Dade trailer parking, FMCSA commercial vehicle licensing
  - `src/features/export/pdf/CoverPage.tsx` - Hardcoded "Fun Box" title
  - `src/features/dashboard/index.tsx` - Miami market description
  - `src/features/auth/login-page.tsx` - "Welcome to Fun Box" greeting
- Why: Built as single-purpose MVP for one business
- Impact: **Blocks the multi-business platform goal entirely**
- Fix approach: Extract all business-specific defaults to a configurable business profile loaded from Firestore. Create `businesses/{businessId}` collection with config, defaults, and section templates.

**Silent Error Handling:**
- Issue: Firestore operations fail silently with empty catch blocks
- Files:
  - `src/app/providers.tsx` - `catch { }` swallows Firestore initialization errors
  - `src/hooks/use-section.ts` - Silent catch on load and save
  - `src/hooks/use-scenario-sync.ts` - Silent catch on scenario save
- Why: Graceful degradation for offline use
- Impact: Users don't know data isn't being persisted. Data loss possible without any warning.
- Fix approach: Add sync status indicator to UI. Log errors. Show toast on persistent failures.

**Single Plan ID Hardcoded:**
- Issue: `currentPlanIdAtom` is hardcoded to `'default-plan'` in `src/store/plan-atoms.ts`
- Why: MVP with single business assumption
- Impact: Cannot support multiple businesses/plans per user
- Fix approach: Make plan ID dynamic, loaded from business selection

## Known Bugs

**No critical bugs detected.** App appears functional for its current single-business scope.

## Security Considerations

**API Keys Exposed to Client:**
- Risk: `VITE_GEMINI_API_KEY` and `VITE_PERPLEXITY_API_KEY` are embedded in client bundle (Vite `VITE_*` prefix exposes to browser)
- Files: `src/lib/ai/gemini-client.ts`, `src/lib/ai/perplexity-client.ts`
- Current mitigation: None (keys visible in browser dev tools)
- Recommendations: Move AI API calls to a server-side proxy (Firebase Cloud Functions) or use API key restrictions (HTTP referrer)

**Email Allowlist in Client Code:**
- Risk: `ALLOWED_EMAILS` array in `src/store/auth-atoms.ts` is client-side only
- Current mitigation: Firebase Auth still requires valid credentials
- Recommendations: Move allowlist to Firestore security rules or server-side check

**No Firestore Security Rules Enforcement:**
- Risk: `firestore.rules` exists but rules may be permissive
- Current mitigation: Firebase Auth required for access
- Recommendations: Review and tighten rules, especially for multi-tenant data isolation

## Performance Bottlenecks

**Large Component Files:**
- Problem: Several section components are very large, increasing bundle and parse time
- Files:
  - `src/features/sections/market-analysis/index.tsx` - ~1,016 lines (includes markdown parser, data parsing, AI integration, full form)
  - `src/features/export/business-plan-view.tsx` - ~896 lines (default data + rendering for all sections)
  - `src/features/sections/operations/index.tsx` - ~651 lines
  - `src/features/sections/marketing-strategy/index.tsx` - ~528 lines
  - `src/features/sections/financial-projections/index.tsx` - ~523 lines
- Cause: All logic, defaults, and UI in single files per section
- Improvement path: Extract utility functions (markdown parsing, data parsing) to `src/lib/`. Split large components into sub-components.

**No Route-Level Code Splitting:**
- Problem: All section components likely loaded upfront
- Cause: Direct imports in `src/app/router.tsx` (no `React.lazy()`)
- Improvement path: Add lazy loading for section routes

## Fragile Areas

**AI Section Prompts:**
- File: `src/lib/ai/section-prompts.ts` (~333 lines)
- Why fragile: 9 Zod schemas tightly coupled to section types. Changes to type interfaces require matching schema updates.
- Common failures: Schema mismatch causes AI responses to fail validation
- Safe modification: Change type and schema simultaneously, test with actual AI generation

**Scenario Atoms Sync:**
- Files: `src/store/scenario-atoms.ts`, `src/hooks/use-scenario-sync.ts`
- Why fragile: Many primitive atoms must stay in sync with `snapshotScenarioAtom` and Firestore. Adding a new scenario variable requires updating atom, snapshot, sync, and types.
- Safe modification: Follow existing pattern for adding atoms, update snapshot and sync together

## Scaling Limits

**Single Firebase Project:**
- Current capacity: Firebase free tier (Spark) or Blaze pay-as-you-go
- Limit: Firestore free tier: 50K reads/day, 20K writes/day, 1GiB storage
- Scaling path: Blaze plan (pay per use), add indexes for multi-business queries

**Client-Side AI Calls:**
- Current capacity: Limited by Gemini/Perplexity API rate limits per key
- Limit: API keys shared across all users (no per-user isolation)
- Scaling path: Server-side proxy with per-user rate limiting

## Dependencies at Risk

**No critical dependency risks detected.** All major dependencies are actively maintained and current:
- React 19.2.0, Firebase 12.9.0, Vite 7.3.1, TypeScript 5.9.3

## Missing Critical Features

**Multi-Business Support:**
- Problem: No concept of multiple businesses per user
- Current workaround: None (single hardcoded business)
- Blocks: The entire multi-business platform goal
- Implementation complexity: High (new data model, business selection UI, configuration system, Firestore restructuring)

**No Testing Infrastructure:**
- Problem: Zero test coverage, no test framework installed
- Current workaround: Manual testing only
- Blocks: Confident refactoring for multi-business migration
- Implementation complexity: Medium (add Vitest, write tests for critical paths)

## Test Coverage Gaps

**Entire Codebase:**
- What's not tested: Everything (no tests exist)
- Risk: Refactoring for multi-business could break existing functionality silently
- Priority: High (especially before major refactoring)
- Key areas to test first:
  - `src/store/derived-atoms.ts` - Pure computations (revenue, profit, CAC)
  - `src/lib/firestore.ts` - Data access operations
  - `src/hooks/use-section.ts` - Core CRUD hook

---

*Concerns audit: 2026-02-11*
*Update as issues are fixed or new ones discovered*
