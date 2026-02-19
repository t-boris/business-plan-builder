---
phase: 18-advanced-scenario-engine
plan: "06"
subsystem: ai
tags: [jotai, ai-context, scenario-engine, xml-prompts]

# Dependency graph
requires:
  - phase: 18-02
    provides: effective-plan composition layer, variantRefs/sectionOverrides atoms
  - phase: 18-04
    provides: section variants for product-service/operations/marketing-strategy
provides:
  - buildScenarioV2Context function for XML-tagged scenario data
  - scenario-aware AI prompt generation with assumptions, variants, horizon, status
affects: [18-07, 18-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "XML-tagged context injection for AI prompts (active_scenario block)"
    - "Scenario v2 atom composition into AI context builder"

key-files:
  created: []
  modified:
    - src/lib/ai/context-builder.ts
    - src/hooks/use-ai-suggestion.ts

key-decisions:
  - "scenarioV2Context always built and passed (even when empty/baseline) for consistent prompt structure"
  - "XML block omits empty sections (no assumptions block if none, no variants block if none)"
  - "Scenario instruction appended inside <task> block only when v2 context is present"

patterns-established:
  - "buildScenarioV2Context: XML context block builder with conditional sections"

issues-created: []

# Metrics
duration: 4min
completed: 2026-02-18
---

# Phase 18 Plan 06: AI Scenario-Aware Context Summary

**buildScenarioV2Context injects scenario name/status/horizon/assumptions/variants as XML context into AI prompts via use-ai-suggestion hook**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T04:57:34Z
- **Completed:** 2026-02-19T05:01:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `buildScenarioV2Context` function that formats scenario v2 data (name, status, horizon, assumptions, variant refs) as an XML-tagged context block
- Updated `buildPrompt` to accept and include optional `scenarioV2Context` parameter with a scenario-aware instruction
- Wired `use-ai-suggestion` hook to read all v2 scenario atoms and pass built context to the prompt builder

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend context-builder with scenario v2 context** - `3732043` (feat)
2. **Task 2: Wire scenario v2 context into AI suggestion hook** - `3844624` (feat)

## Files Created/Modified
- `src/lib/ai/context-builder.ts` - Added `buildScenarioV2Context` function and updated `buildPrompt` signature with `scenarioV2Context` parameter
- `src/hooks/use-ai-suggestion.ts` - Imported v2 atoms and `buildScenarioV2Context`, builds and passes scenario context to prompt builder

## Decisions Made
- scenarioV2Context is always built and passed (even for baseline scenarios) to maintain consistent prompt structure; the XML block conditionally omits empty sections (assumptions, variants)
- The scenario-aware instruction ("Consider the active scenario context...") is appended inside the `<task>` block only when v2 context is present, preserving backward compatibility for callers that don't pass it

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed eslint unused-var error for destructured variantId**
- **Found during:** Task 1 (buildScenarioV2Context implementation)
- **Issue:** Destructuring `[slug, _variantId]` in the variant loop triggered `@typescript-eslint/no-unused-vars` lint error
- **Fix:** Changed to `[slug]` destructuring since variantId is not needed in the loop body
- **Files modified:** src/lib/ai/context-builder.ts
- **Verification:** `npx eslint` passes with no errors
- **Committed in:** 3732043 (amended into Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor lint fix, no scope creep.

## Issues Encountered
None

## Next Phase Readiness
- AI context builder now fully scenario-aware with v2 data
- Ready for 18-07 (Export scenario pack) which will use similar scenario data for PDF/web export
- No blockers

---
*Phase: 18-advanced-scenario-engine*
*Completed: 2026-02-18*
