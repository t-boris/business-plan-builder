---
phase: 04-strip-hardcoded-content
plan: 01
subsystem: scenarios, ai
tags: [jotai, scenario-engine, ai-prompts, gemini, zod]

# Dependency graph
requires:
  - phase: 03-dynamic-business-context
    provides: business-scoped Firestore operations and activeBusinessIdAtom
provides:
  - Generic ScenarioVariables type (priceTier1/2/3, staffCount, costPerUnit)
  - Zeroed DEFAULT_SCENARIO_VARIABLES
  - Generic AI system prompt and section prompts
  - Business-scoped scenario comparison
affects: [04-02, 04-03, 07-dynamic-scenario-engine, 08-business-aware-ai]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Generic tier-based pricing variables (priceTier1/2/3) replacing business-specific names
    - Zeroed defaults pattern for per-business population

key-files:
  created: []
  modified:
    - src/types/scenario.ts
    - src/lib/constants.ts
    - src/store/scenario-atoms.ts
    - src/store/derived-atoms.ts
    - src/features/scenarios/scenario-controls.tsx
    - src/features/scenarios/scenario-comparison.tsx
    - src/lib/ai/system-prompt.ts
    - src/lib/ai/context-builder.ts
    - src/lib/ai/section-prompts.ts

key-decisions:
  - "Zeroed all DEFAULT_SCENARIO_VARIABLES rather than using sample values — per-business population deferred to Phase 7"
  - "MONTHLY_FIXED_COSTS set to 0 — formula preserved for Phase 7 dynamic costs"
  - "CostBreakdownSchema descriptions genericized (supplies/materials per participant, venue/ticket cost per person)"

issues-created: []

# Metrics
duration: 5min
completed: 2026-02-12
---

# Phase 4 Plan 01: Genericize Core Types, Constants, Scenario Engine, and AI Layer Summary

**Generic priceTier1/2/3 scenario variables, zeroed defaults, business-scoped comparison, and business-agnostic AI prompts across all 9 sections**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-12T00:05:45Z
- **Completed:** 2026-02-12T00:11:04Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- ScenarioVariables interface uses generic field names (priceTier1/2/3, staffCount, costPerUnit)
- DEFAULT_SCENARIO_VARIABLES has all zeroed defaults; Fun Box-specific exports removed (DEFAULT_PACKAGES, DEFAULT_MARKETING_CHANNELS, DEFAULT_KPI_TARGETS, CREW_HOURLY_RATE, AVG_HOURS_PER_EVENT)
- All scenario atom names genericized across scenario-atoms.ts and derived-atoms.ts
- Scenario controls show generic tier labels; comparison uses business-scoped data via activeBusinessIdAtom
- AI system prompt, context builder, and all 9 section prompts contain zero Fun Box/Miami/Ocean/Jellyfish content

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename scenario variables and clean constants** - `73e444d` (feat)
2. **Task 2: Clean scenario UI controls and comparison** - `e5c7d7c` (feat)
3. **Task 3: Genericize AI layer** - `821980d` (feat)

## Files Created/Modified
- `src/types/scenario.ts` - ScenarioVariables: priceTier1/2/3, staffCount, costPerUnit
- `src/lib/constants.ts` - Zeroed defaults, removed Fun Box constants
- `src/store/scenario-atoms.ts` - Renamed all atoms to match new field names
- `src/store/derived-atoms.ts` - Updated imports and formula references
- `src/features/scenarios/scenario-controls.tsx` - Generic UI labels
- `src/features/scenarios/scenario-comparison.tsx` - Business-scoped data via activeBusinessIdAtom
- `src/lib/ai/system-prompt.ts` - Generic business plan assistant instruction
- `src/lib/ai/context-builder.ts` - Generic placeholder for business overview
- `src/lib/ai/section-prompts.ts` - All 9 sections genericized

## Decisions Made
- Zeroed all DEFAULT_SCENARIO_VARIABLES rather than using sample values -- per-business population deferred to Phase 7
- MONTHLY_FIXED_COSTS set to 0 with formula preserved for Phase 7 dynamic costs
- CostBreakdownSchema descriptions genericized (supplies/materials per participant, venue/ticket cost per person)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Ready for 04-02-PLAN.md (Wave 2: section components and remaining downstream consumers)
- Downstream files that reference old field names (dashboard, export, financial-projections, etc.) will be fixed in 04-02 and 04-03

---
*Phase: 04-strip-hardcoded-content*
*Completed: 2026-02-12*
