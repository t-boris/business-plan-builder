---
phase: 20-generic-industry-agnostic-operations
plan: 02
subsystem: ui
tags: [operations, collapsible, select, cost-items, workforce, capacity, metrics]

# Dependency graph
requires:
  - phase: 20-01
    provides: Generic Operations types, normalizeOperations, computeOperationsCosts
provides:
  - Fully rewritten generic Operations section editor with 8 collapsible sections
  - Live computed cost summaries from costItems
  - Normalization on mount for backward compatibility
affects: [20-03, 20-04, scenario-engine, export]

# Tech tracking
tech-stack:
  added: []
  patterns: [collapsible-section-ui, select-driver-type, computed-summary-cards]

key-files:
  created: []
  modified:
    - src/features/sections/operations/index.tsx

key-decisions:
  - "No AiFieldTrigger needed — Operations data is primarily quantitative (numbers, short labels, lists)"
  - "Used Collapsible from radix-ui for section toggling, all sections open by default"
  - "Removed all recharts visualizations (pie/bar charts) — will be reconsidered in future enhancement"

patterns-established:
  - "Collapsible section pattern: SectionHeader component with ChevronDown icon + Collapsible wrapper, reusable across sections"
  - "Cost item rendering with real-index tracking for mixed variable/fixed arrays"

issues-created: []

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 20 Plan 02: UI Rewrite — Tabbed/Sectioned Generic Editor Summary

**Replaced 603-line event-specific Operations editor with universal industry-agnostic editor using Collapsible sections, Select driver types, and live computed cost summaries**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T14:56:13Z
- **Completed:** 2026-02-19T14:59:20Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Completely rewrote operations/index.tsx from event-specific model (CrewMember, CostBreakdown, per-event charts) to universal generic editor
- 8 collapsible sections: Summary stat cards, Team, Capacity, Variable Costs, Fixed Costs, Equipment, Safety Protocols, Operational Metrics
- Live computed cost summaries via computeOperationsCosts (variable/fixed/workforce/total monthly)
- Normalization on mount for backward compatibility with legacy event-based Firestore data
- No event-specific terminology, no business-type conditional rendering anywhere in editor

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite operations/index.tsx with tabbed/sectioned generic editor** - `66b2271` (feat)
2. **Task 2: Wire AiFieldTrigger into Operations textarea fields** - No commit needed (Operations has no Textarea fields; data is primarily quantitative)

**Plan metadata:** (see docs commit below)

## Files Created/Modified
- `src/features/sections/operations/index.tsx` - Complete rewrite: 8 collapsible sections using generic Operations model with Select for driver types, computed subtotals, and empty states

## Decisions Made
- Operations has no eligible AiFieldTrigger targets since all data is quantitative (numbers, short labels, string lists). Whole-tab AI (AiActionBar) remains functional for generating/improving the full section.
- Used Collapsible from radix-ui (already in the codebase) for section toggling, all open by default
- Removed recharts pie/bar chart visualizations from the old editor — the new model's cost structure is better served by the summary stat cards and inline subtotals

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Operations editor fully functional with generic model, ready for AI schema rewrite in 20-03
- Export (web + PDF) still references old Operations types and will need updating in 20-04
- All section data flows through normalizeOperations at read boundary and computeOperationsCosts for display

---
*Phase: 20-generic-industry-agnostic-operations*
*Completed: 2026-02-19*
