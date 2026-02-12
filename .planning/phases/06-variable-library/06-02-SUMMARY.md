---
phase: 06-variable-library
plan: 02
subsystem: data
tags: [variable-templates, business-types, financial-modeling, VariableDefinition]

# Dependency graph
requires:
  - phase: 01-firestore-data-model
    provides: VariableDefinition type in types/business.ts
  - phase: 06-variable-library plan 01
    provides: VariableDefinition type refinements
provides:
  - 7 business-type variable template arrays (SaaS, Service, Retail, Restaurant, Event, Manufacturing, Custom)
  - VARIABLE_TEMPLATES lookup map (BusinessType -> VariableDefinition[])
  - getDefaultVariables helper (BusinessType -> Record<string, VariableDefinition>)
  - getTemplateVariables re-export from business-templates.ts
affects: [07-generic-scenario-engine, 06-variable-library plan 03, 08-business-aware-ai]

# Tech tracking
tech-stack:
  added: []
  patterns: [variable-template-per-business-type, formula-string-with-dependsOn, decimal-percent-convention]

key-files:
  created:
    - src/lib/variable-templates/saas.ts
    - src/lib/variable-templates/service.ts
    - src/lib/variable-templates/retail.ts
    - src/lib/variable-templates/restaurant.ts
    - src/lib/variable-templates/event.ts
    - src/lib/variable-templates/manufacturing.ts
    - src/lib/variable-templates/custom.ts
    - src/lib/variable-templates/index.ts
  modified:
    - src/lib/business-templates.ts

key-decisions:
  - "Construct VariableDefinition objects directly without helper factories"
  - "Re-export getDefaultVariables as getTemplateVariables from business-templates.ts (Option B - keep template objects lean)"

patterns-established:
  - "Variable template pattern: one exported array per business type, VariableDefinition objects with formula strings and dependsOn arrays"
  - "Percent convention: all percent values stored as decimals (0.30 = 30%), formulas use decimal form"
  - "Division guards in formulas: ternary pattern (x > 0 ? a / x : 0) prevents NaN/Infinity"

issues-created: []

# Metrics
duration: 4min
completed: 2026-02-12
---

# Phase 6 Plan 2: Variable Templates Summary

**7 business-type variable templates with 130 total variables (53 input + 77 computed) covering SaaS MRR/churn/LTV, restaurant covers/prime cost, retail foot traffic/conversion, and more**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T01:47:12Z
- **Completed:** 2026-02-12T01:51:02Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created curated variable templates for all 7 business types with industry-standard KPIs
- Built VARIABLE_TEMPLATES lookup map and getDefaultVariables helper for efficient variable access
- Wired variable templates into existing business-templates.ts via getTemplateVariables re-export
- All formulas use division guards and decimal percent convention consistently

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SaaS, Service, Retail, and Restaurant variable templates** - `8601f5a` (feat)
2. **Task 2: Create Event, Manufacturing, Custom templates + index + wire to business-templates.ts** - `ebe4fe2` (feat)

## Files Created/Modified
- `src/lib/variable-templates/saas.ts` - 21 vars: MRR, ARR, churn, LTV:CAC, profit margin
- `src/lib/variable-templates/service.ts` - 18 vars: utilization, billable hours, effective rate, revenue per employee
- `src/lib/variable-templates/retail.ts` - 21 vars: foot traffic, conversion rate, COGS, gross margin
- `src/lib/variable-templates/restaurant.ts` - 22 vars: covers, average check, food/labor cost %, prime cost
- `src/lib/variable-templates/event.ts` - 19 vars: per-event economics, break-even events, variable costs
- `src/lib/variable-templates/manufacturing.ts` - 23 vars: capacity utilization, yield rate, cost per sellable unit
- `src/lib/variable-templates/custom.ts` - 6 vars: minimal revenue/costs/profit starting set
- `src/lib/variable-templates/index.ts` - Re-exports all templates, VARIABLE_TEMPLATES map, getDefaultVariables
- `src/lib/business-templates.ts` - Added getTemplateVariables re-export

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Construct VariableDefinition objects directly (no helper factories) | Plan 06-01 runs in parallel; direct construction avoids cross-plan dependency and is explicit |
| Re-export as getTemplateVariables from business-templates.ts (Option B) | Keeps template objects lean; consumers use existing import point for template data |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness
- All 7 business type variable templates ready for UI integration (06-03)
- getDefaultVariables provides Record<string, VariableDefinition> keyed by variable ID
- Formula strings ready for expr-eval evaluation (Phase 7)
- dependsOn arrays enable topological sort for evaluation ordering

---
*Phase: 06-variable-library*
*Completed: 2026-02-12*
