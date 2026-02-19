---
phase: 16-ai-backend-proxy
plan: 01
status: complete
date: 2026-02-18
---

# 16-01 Summary: Firebase Functions AI Proxy Endpoints

## What was done

Created a Firebase Functions project with 3 proxy endpoints to move AI API keys
server-side, eliminating client-side key exposure.

### Task 1: Initialize Firebase Functions project
- Created `functions/` directory with `package.json`, `tsconfig.json`, `.gitignore`
- Installed dependencies: `firebase-admin`, `firebase-functions`, `@google/genai`
- Updated `firebase.json` with functions config (nodejs20 runtime) and functions emulator (port 5001)
- Updated root `emulator` npm script to include functions alongside firestore
- Updated root `.gitignore` to exclude `functions/lib/` and `functions/.secret.local`

### Task 2: Create proxy endpoints with auth and rate limiting
Created `functions/src/index.ts` with 3 Cloud Functions v2 `onRequest` endpoints:

1. **`aiGeminiGenerate`** — POST, accepts `{ prompt, systemInstruction }`, returns `{ text }`
2. **`aiGeminiStructured`** — POST, accepts `{ prompt, systemInstruction, jsonSchema }`, returns `{ data }`
3. **`aiPerplexitySearch`** — POST, accepts `{ query }`, returns `{ content, citations }`

Shared infrastructure:
- **Auth verification**: Extracts and verifies Firebase Auth ID token from `Authorization: Bearer` header
- **Rate limiting**: In-memory map, 30 requests per minute per UID, auto-cleanup every 60 seconds
- **CORS**: Allows `localhost:5173`, `my-business-planning.web.app`, and `my-business-planning.firebaseapp.com`
- **Timeout**: 120 seconds per request (Gemini can be slow)
- **Secrets**: Uses `defineSecret` from `firebase-functions/params` for `GEMINI_API_KEY` and `PERPLEXITY_API_KEY`
- **Error handling**: 401 for auth errors, 429 for rate limits (upstream and local), 500 for unexpected errors

### Task 3: Create local secrets file
- Created `functions/.secret.local` with actual API keys from root `.env` (without `VITE_` prefix)
- Verified file is gitignored
- Verified build passes

## Files created
- `functions/package.json` — Functions project config with dependencies
- `functions/tsconfig.json` — TypeScript config targeting ES2022/NodeNext
- `functions/.gitignore` — Ignores lib/, node_modules/, .secret.local
- `functions/src/index.ts` — 3 proxy endpoints with auth, rate limiting, error handling
- `functions/.secret.local` — Local secrets for emulator development (gitignored)

## Files modified
- `firebase.json` — Added functions config and functions emulator
- `package.json` — Updated emulator script to include functions
- `.gitignore` — Added functions/lib/ and functions/.secret.local

## Verification
- [x] functions/ directory exists with package.json, tsconfig.json, src/index.ts
- [x] `cd functions && npm run build` passes
- [x] firebase.json includes functions config and functions emulator
- [x] 3 proxy endpoints exported (aiGeminiGenerate, aiGeminiStructured, aiPerplexitySearch)
- [x] Auth verification in place
- [x] Rate limiting in place (30 req/min per UID)
- [x] .secret.local in .gitignore

## Next steps
- Plan 16-02: Update frontend clients to call these proxy endpoints instead of calling AI APIs directly
