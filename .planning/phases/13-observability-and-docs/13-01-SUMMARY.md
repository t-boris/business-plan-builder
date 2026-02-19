---
phase: 13-observability-and-docs
plan: 01
subsystem: observability
tags: [logging, security, gitignore, structured-logging]

requires:
  - phase: 12-integration-and-polish
    provides: Stable lib layer with AI clients and formula engine
provides:
  - Structured logging module (createLogger factory)
  - .env secured in .gitignore
  - AI clients and formula engine instrumented with structured logs
affects:
  - src/lib/ai/gemini-client.ts
  - src/lib/ai/perplexity-client.ts
  - src/lib/formula-engine.ts

tech-stack:
  added: []
  patterns:
    - "Domain-scoped structured logging via createLogger factory"
    - "Dev: human-readable console output; Prod: JSON string for log aggregation"

key-files:
  created:
    - src/lib/logger.ts
  modified:
    - .gitignore
    - src/lib/ai/gemini-client.ts
    - src/lib/ai/perplexity-client.ts
    - src/lib/formula-engine.ts

key-decisions:
  - "Pure console-based logging, no external dependencies (Sentry/Datadog deferred)"
  - "Domain prefix baked into logger instance (e.g. ai.gemini.request.failed)"
  - "Dev mode uses native console methods for browser DevTools integration"
  - "Prod mode emits single-line JSON for future log aggregation pipelines"
  - "__APP_VERSION__ included in every log entry for release correlation"

patterns-established:
  - "createLogger('domain') for all new modules needing structured logging"

issues-created: []

duration: 5min
completed: 2026-02-18
---

# Phase 13 Plan 01: Structured Logging and Secrets Fix

**Created a structured logging module with domain-scoped logger factory, secured .env in .gitignore, and instrumented the AI clients and formula engine with structured log events. Establishes the observability foundation for all subsequent production-readiness phases.**

## Performance

- **Duration:** 5 min
- **Tasks:** 3
- **Files created:** 1
- **Files modified:** 4

## Accomplishments

- Added `.env` to .gitignore with explicit Firebase debug log entries
- Verified `.env` is properly ignored via `git check-ignore`
- Created `src/lib/logger.ts` (57 lines) with `createLogger` factory and default `logger` instance
- Logger supports 4 levels: debug, info, warn, error
- Every log entry includes level, event, timestamp, version, and optional data
- Dev mode outputs human-readable console; prod mode outputs JSON strings
- Replaced `console.warn` in `formula-engine.ts` with `log.warn('evaluation.error', ...)`
- Added structured error/rate-limit logging to `gemini-client.ts` (both `generateSectionContent` and `generateStructuredContent`)
- Added structured error/rate-limit logging to `perplexity-client.ts` (HTTP errors and catch block)
- Verified zero raw `console.*` calls remain in instrumented files

## Task Commits

1. **Task 1: Fix .gitignore secrets exposure** - `46e21ef`
2. **Task 2: Create structured logging module** - `3d17245`
3. **Task 3: Instrument lib layer with structured logger** - `80a6bbe`

## Files Created/Modified

- `.gitignore` - Added `.env`, `firestore-debug.log`, `firebase-debug.log`
- `src/lib/logger.ts` - New structured logging module (57 lines)
- `src/lib/ai/gemini-client.ts` - Replaced error paths with structured logger
- `src/lib/ai/perplexity-client.ts` - Replaced error paths with structured logger
- `src/lib/formula-engine.ts` - Replaced console.warn with structured logger

## Decisions Made

- Kept logger at 57 lines with zero external dependencies
- Used `import.meta.env.DEV` for environment detection (consistent with Vite patterns already in codebase)
- Did not touch hooks (use-section, use-scenario-sync) per plan scope -- deferred to Phase 14
- Pre-existing TypeScript errors in market-analysis components are unrelated to this plan

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript build errors in `src/features/sections/market-analysis/components/` cause `tsc -b` to fail, but these are unrelated to this plan's changes. Vite production build (`vite build`) succeeds cleanly.

## Next Phase Readiness

- Structured logging module is ready for use by any new module
- `createLogger('domain')` pattern established for consistent adoption
- AI clients and formula engine are fully instrumented
- No blockers for subsequent plans (Phase 14 hook instrumentation, etc.)

---
*Phase: 13-observability-and-docs*
*Completed: 2026-02-18*
