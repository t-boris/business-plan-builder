# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** Financial scenario modeling across multiple businesses with real-time derived metrics
**Current focus:** Phase 5 — Business Profile & Section Config (In progress)

## Current Position

Phase: 5 of 12 (Business Profile & Section Config)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-12 — Completed 05-01-PLAN.md

Progress: ████░░░░░░ 43%

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 3 min
- Total execution time: 42 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-firestore-data-model | 2/2 | 4 min | 2 min |
| 02-business-crud | 5/5 | 11 min | 2 min |
| 03-dynamic-business-context | 2/2 | 6 min | 3 min |
| 04-strip-hardcoded-content | 3/3 | 19 min | 6 min |
| 05-business-profile-section-config | 1/2 | 2 min | 2 min |

**Recent Trend:**
- Last 5 plans: 03-02 (3 min), 04-01 (5 min), 04-02 (6 min), 04-03 (8 min), 05-01 (2 min)
- Trend: Consistent

## Accumulated Context

### Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | ISO string timestamps (no Date objects) | Firestore serialization safety |
| 01-01 | Recursive FieldSchema (children/itemSchema) | Enables arbitrary field nesting within Firestore limits |
| 01-01 | Bidirectional variable dependency graph | Efficient traversal for both evaluation order and invalidation |
| 01-02 | Client-side sort for getUserBusinesses | Avoids composite index requirement with inequality filter on roles map |
| 01-02 | snap.id spread into returned objects | Populate id field from Firestore document ID rather than stored data |
| 01-02 | Subcollection rules use get() for parent roles | 1 get call per access, within Firestore's 10-call limit |
| 01-02 | sectionKey as document ID, auto-ID for scenarios | Deterministic section paths vs flexible scenario creation |
| 02-01 | localStorage read/write in hook, not atom | Atoms stay pure; side effects belong in hooks |
| 02-01 | Client-side template definitions separate from Firestore templates | UI picker data now; Firestore templates deferred to Phase 6 |
| 02-02 | Static iconMap Record for Lucide icon resolution | All 7 icons known at build time; simpler than dynamic imports |
| 02-02 | Two-step inline flow (not wizard/stepper) | Low-friction creation per context vision |
| 02-03 | Inline formatRelativeTime helper (no date library) | Simple Date.now() comparison sufficient; avoids dependency |
| 02-03 | Delete dialog delegates deletion via onConfirm prop | Keeps dialog reusable and decoupled from state management |
| 02-04 | getTemplateName helper colocated in app-sidebar.tsx | Private to component; not reusable enough to extract |
| 02-05 | BusinessLoader placed before ScenarioSync in provider tree | Phase 3 dependency order: scenario loading will depend on active business |
| 02-05 | Conditional Route element prop for active business guard | Cleaner than wrapper component; handles loading/redirect/layout in one expression |
| 03-01 | Raw section data format for useSection (not full BusinessSection wrapper) | Phase 5 will migrate to full format; avoids premature schema dependency |
| 03-01 | Legacy Scenario type for scenario operations (not BusinessScenario) | Phase 7 will migrate to dynamic VariableDefinition variables |
| 03-01 | prevBusinessIdRef pattern for ScenarioSync business change detection | Avoids restructuring component; cleanly resets loaded state on switch |
| 03-02 | URL is single source of truth for active business | BusinessContextLayout syncs URL param to atom and localStorage |
| 03-02 | loadBusinesses stripped of activeBusinessId selection logic | Router handles business context; hook stays pure data-only |
| 03-02 | removeBusiness handles data only, caller handles navigation | Keeps hook decoupled from routing concerns |
| 03-02 | Sidebar section filtering uses slug matching against enabledSections | Slug values in enabledSections match URL path segments exactly |
| 04-01 | Zeroed all DEFAULT_SCENARIO_VARIABLES | Per-business population deferred to Phase 7 |
| 04-01 | MONTHLY_FIXED_COSTS set to 0, formula preserved | Phase 7 will make dynamic |
| 04-01 | CostBreakdownSchema descriptions genericized | Removed business-specific descriptions (craft/slime, museum) |
| 04-02 | generateMonthsFromCoefficients fully parameterized | No module-level cost constants; all values passed as arguments |
| 04-02 | Break-even uses first month's overhead as proxy | Data-driven; falls back to 0 if no months exist |
| 04-02 | Operations cost breakdown defaults all zeroed | Form structure preserved; empty state shows zeros |
| 04-02 | "Venue / Tickets" replaces "Museum Tickets" | Generic label for operations cost category |
| 04-03 | Flat season coefficients as dashboard default | Avoids importing from financial-projections (being cleaned by 04-02) |
| 04-03 | Calendar months Jan-Dec in dashboard | Standard calendar order replaces Fun Box fiscal year Mar-Feb |
| 04-03 | Briefcase Lucide icon for login branding | Generic business tool aesthetic, replaces hardcoded "F" letter |
| 04-03 | CoverPage accepts optional businessName prop | Future Phase 11 will pass dynamic name; falls back to "Business Plan" |
| 05-01 | Full profile spread for Firestore setDoc merge | Ensures correct deep merge by passing complete profile with overrides |
| 05-01 | No debouncing at hook level for profile updates | Header bar component (05-02) handles debounce; toggleSection saves immediately |

### Deferred Issues

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 05-01-PLAN.md (Phase 5 in progress)
Resume file: None
