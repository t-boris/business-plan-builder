# External Integrations

**Analysis Date:** 2026-02-11

## APIs & External Services

**AI Content Generation - Google Gemini:**
- Service: Google Generative AI (Gemini 2.5 Flash)
- Purpose: Business plan section content generation (generate/improve/expand)
- SDK/Client: `@google/generative-ai` (`src/lib/ai/gemini-client.ts`)
- Auth: API key in `VITE_GEMINI_API_KEY` env var
- Features used:
  - Free-text generation: `generateSectionContent()`
  - Structured JSON generation: `generateStructuredContent<T>()` with JSON Schema
  - System prompt: `src/lib/ai/system-prompt.ts`
  - 9 section-specific prompts + Zod schemas: `src/lib/ai/section-prompts.ts`
  - Context building: `src/lib/ai/context-builder.ts`
- Integration hook: `src/hooks/use-ai-suggestion.ts`
- Error handling: Rate limit detection, generic error messages

**AI Market Research - Perplexity:**
- Service: Perplexity AI (Sonar model)
- Purpose: Real-time market research with web search and citations
- Client: Custom fetch wrapper (`src/lib/ai/perplexity-client.ts`)
- Endpoint: `https://api.perplexity.ai/chat/completions`
- Auth: API key in `VITE_PERPLEXITY_API_KEY` env var
- Integration hook: `src/hooks/use-market-research.ts`
- Error handling: Rate limit detection, generic error messages
- No caching of results

## Data Storage

**Databases:**
- Firebase Firestore - Primary and only data store
  - Connection: Firebase SDK initialized in `src/lib/firebase.ts`
  - Client: Firebase SDK 12.9.0 (modular imports)
  - CRUD operations: `src/lib/firestore.ts`
  - Document structure:
    ```
    plans/{planId}/
      sections/{sectionSlug}     # Business plan section data
      scenarios/{scenarioId}     # Scenario variables + metadata
      state/preferences          # Active scenario ID
    ```
  - Operations: `getSection()`, `saveSection()`, `getScenario()`, `saveScenario()`, `listScenarios()`, `deleteScenario()`, `getActiveState()`, `saveActiveState()`
  - Write pattern: Debounced (500ms) via hooks, `setDoc` with `{ merge: true }`
  - Read pattern: One-time `getDoc()` on mount (no real-time listeners except scenario list)

**File Storage:**
- Not used

**Caching:**
- No caching layer (all reads go to Firestore)

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication (`src/lib/firebase.ts`, `src/hooks/use-auth.ts`)
- Implementation: Firebase SDK with `onAuthStateChanged` listener
- Methods:
  - Google OAuth: `signInWithPopup()` with `GoogleAuthProvider`
  - Email/password: `signInWithEmailAndPassword()`
- State management: `src/store/auth-atoms.ts` (authStateAtom, authStatusAtom, authUserAtom)
- Access control: Email allowlist (`ALLOWED_EMAILS` array in `src/store/auth-atoms.ts`)
- Auth guard: Route-level check in `src/app/router.tsx`

**OAuth Integrations:**
- Google OAuth - Sign-in only
  - Credentials: Managed via Firebase project configuration
  - Scopes: Default (email, profile)

## Monitoring & Observability

**Error Tracking:**
- Not configured (no Sentry, Datadog, etc.)

**Analytics:**
- Not configured

**Logs:**
- Console only (no external logging service)

## CI/CD & Deployment

**Hosting:**
- Firebase Hosting (`firebase.json`)
- Public directory: `dist`
- SPA rewrite: All routes -> `index.html`
- Deployment: Manual (no CI/CD pipeline detected)

**CI Pipeline:**
- Not configured (no GitHub Actions, no CI files)

## Environment Configuration

**Development:**
- Required env vars: All `VITE_FIREBASE_*` vars, `VITE_GEMINI_API_KEY`, `VITE_PERPLEXITY_API_KEY`
- Secrets location: `.env.local` (gitignored)
- Template: `.env.example` with all required vars listed
- Local services: Firestore emulator on port 8080 (auto-connected in dev mode via `src/lib/firebase.ts`)

**Production:**
- Secrets management: Environment variables (deployment platform)
- Same Firebase project (no staging separation detected)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-02-11*
*Update when adding/removing external services*
