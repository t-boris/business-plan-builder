---
phase: 16-ai-backend-proxy
plan: 02
status: complete
date: 2026-02-18
---

# 16-02 Summary: Refactor Frontend AI Clients to Use Proxy

## What was done

Rewrote the frontend AI clients to call Firebase Functions proxy endpoints instead of
making direct API calls. Removed all AI API keys from the client-side bundle.

### Task 1: Create shared proxy fetch helper
- Created `src/lib/ai/proxy-fetch.ts` with `proxyFetch<T>()` function
- Automatic dev/prod URL resolution (emulator on localhost:5001, Cloud Functions in production)
- Firebase Auth ID token injected via `Authorization: Bearer` header on every request
- Standardized error handling: 401 (auth), 429 (rate limit), generic proxy errors
- Uses `createLogger('ai.proxy')` for structured logging

### Task 2: Rewrite gemini-client.ts to use proxy
- Removed all `@google/genai` SDK imports and direct Gemini API usage
- `generateSectionContent` now calls `proxyFetch('aiGeminiGenerate', ...)` returning `{ text }`
- `generateStructuredContent` now calls `proxyFetch('aiGeminiStructured', ...)` returning `{ data }`
- `isAiAvailable` set to `true` (server handles availability)
- Removed `@google/genai` from root `package.json` via `npm uninstall`

### Task 3: Rewrite perplexity-client.ts to use proxy
- Removed direct `fetch` to `https://api.perplexity.ai/chat/completions`
- Removed `VITE_PERPLEXITY_API_KEY` env var reading
- `searchPerplexity` now calls `proxyFetch('aiPerplexitySearch', ...)` returning `{ content, citations }`
- `isPerplexityAvailable` set to `true` (server handles availability)

### Task 4: Clean up env vars and deps, verify build
- Removed `VITE_GEMINI_API_KEY` and `VITE_PERPLEXITY_API_KEY` from `.env.example`
- Added comment pointing to `functions/.secret.local` for local dev setup
- Updated `ai-action-bar.tsx` tooltip (removed stale reference to `VITE_GEMINI_API_KEY`)
- Verified full build pipeline passes

## Files created
- `src/lib/ai/proxy-fetch.ts` — Shared fetch helper with auth, URL resolution, error handling

## Files modified
- `src/lib/ai/gemini-client.ts` — Rewritten to use proxyFetch (89 lines -> 36 lines)
- `src/lib/ai/perplexity-client.ts` — Rewritten to use proxyFetch (79 lines -> 16 lines)
- `src/components/ai-action-bar.tsx` — Updated disabled tooltip message
- `.env.example` — Removed AI API key entries, added server-side note
- `package.json` — Removed `@google/genai` dependency
- `package-lock.json` — Updated after uninstall

## Verification
- [x] `npx vite build` succeeds
- [x] `cd functions && npm run build` succeeds
- [x] No `VITE_GEMINI_API_KEY` in src/
- [x] No `VITE_PERPLEXITY_API_KEY` in src/
- [x] No `@google/genai` import in src/
- [x] No direct `api.perplexity.ai` calls in src/
- [x] `npx vitest run` passes all 44 tests
- [x] `npm run lint` passes (0 errors, 7 pre-existing warnings)

## Architecture after this plan

```
Browser
  └── gemini-client.ts / perplexity-client.ts
        └── proxyFetch() (src/lib/ai/proxy-fetch.ts)
              ├── auth.currentUser.getIdToken()
              └── fetch(POST) → Firebase Functions (functions/src/index.ts)
                    ├── aiGeminiGenerate → Gemini API
                    ├── aiGeminiStructured → Gemini API
                    └── aiPerplexitySearch → Perplexity API
```

## Next steps
- Phase 16-03 (if planned): End-to-end testing with emulator running
- The frontend AI integration is now fully proxied through authenticated Firebase Functions
