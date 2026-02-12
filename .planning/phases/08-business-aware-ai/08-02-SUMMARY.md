---
phase: 08-business-aware-ai
plan: 02
subsystem: ai
tags: [gemini, prompt-engineering, industry-overlays, business-context, jotai]

# Dependency graph
requires:
  - phase: 08-business-aware-ai/01
    provides: buildSystemPrompt, industry-config, business-aware context-builder
  - phase: 07-generic-scenario-engine
    provides: evaluatedValuesAtom, businessVariablesAtom
  - phase: 05-business-profile-section-config
    provides: BusinessProfile in activeBusinessAtom
provides:
  - Industry-specific section prompt overlays (6 types x 4 sections)
  - Fully wired AI consumer with dynamic system prompt and business context
  - No more static SYSTEM_INSTRUCTION constant
affects: [10-dashboard-navigation, 11-export-updates, 12-integration-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Industry overlay pattern: Partial<Record<BusinessType, Partial<Record<SectionSlug, string>>>> appended to generate prompts only"
    - "Per-request system prompt: buildSystemPrompt called in useCallback with live business profile"

key-files:
  created: []
  modified:
    - src/lib/ai/section-prompts.ts
    - src/hooks/use-ai-suggestion.ts
    - src/lib/ai/context-builder.ts
    - src/lib/ai/system-prompt.ts

key-decisions:
  - "Only generate action gets industry overlays; improve/expand work on existing data"
  - "Custom business type has no overlays — base prompts used as-is"
  - "Fallback empty profile when business not configured: type custom, currency USD"

patterns-established:
  - "INDUSTRY_OVERLAYS map: Partial<Record<BusinessType, Partial<Record<SectionSlug, string>>>> for section-specific guidance by business type"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 8 Plan 02: Industry Overlays and AI Consumer Wiring Summary

**6 business types with industry-specific section overlays for 4 key sections, AI consumer fully wired with dynamic system prompt from business profile and variable definitions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T03:11:47Z
- **Completed:** 2026-02-12T03:14:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Industry-specific prompt overlays for saas, restaurant, retail, service, event, manufacturing across market-analysis, financial-projections, operations, marketing-strategy
- getSectionPrompt accepts optional businessType and appends overlays only for generate action
- use-ai-suggestion.ts reads activeBusinessAtom and businessVariablesAtom from Jotai store
- Dynamic system prompt built per-request from business profile via buildSystemPrompt
- context-builder passes profile.type to getSectionPrompt for industry-aware prompts
- Removed backwards-compatible SYSTEM_INSTRUCTION constant — Phase 8 complete

## Task Commits

Each task was committed atomically:

1. **Task 1: Add industry overlays to section-prompts.ts** - `6fc90da` (feat)
2. **Task 2: Wire use-ai-suggestion.ts with dynamic system prompt and business context** - `79f9567` (feat)

## Files Created/Modified
- `src/lib/ai/section-prompts.ts` - INDUSTRY_OVERLAYS map (6 types x 4 sections), updated getSectionPrompt with optional businessType parameter
- `src/hooks/use-ai-suggestion.ts` - Reads activeBusinessAtom and businessVariablesAtom, builds dynamic system prompt per-request, passes variableDefinitions to buildPrompt
- `src/lib/ai/context-builder.ts` - Passes profile?.type to getSectionPrompt for industry overlay selection
- `src/lib/ai/system-prompt.ts` - Removed SYSTEM_INSTRUCTION export (only buildSystemPrompt remains)

## Decisions Made
- Only generate action gets industry overlays; improve/expand actions work on existing data and don't need business-type-specific guidance
- Custom business type has no overlays — base prompts used as-is
- Fallback empty profile (type: 'custom', currency: 'USD') when no business is active

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Phase 8 complete: AI is fully business-aware
- Different business types now get fundamentally different AI guidance
- Ready for Phase 9 (Sharing & Access) or Phase 10 (Dashboard & Navigation)

---
*Phase: 08-business-aware-ai*
*Completed: 2026-02-12*
