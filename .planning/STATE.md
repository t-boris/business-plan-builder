# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** Financial scenario modeling across multiple businesses with real-time derived metrics
**Current focus:** Phase 12 -- Integration & Polish

## Current Position

Phase: 12 of 12 (Integration & Polish)
Plan: 5 of 6 in current phase
Status: In progress
Last activity: 2026-02-12 -- Completed 12-06-PLAN.md

Progress: ██████████░ 97%

## Performance Metrics

**Velocity:**
- Total plans completed: 36
- Average duration: 3 min
- Total execution time: 119 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-firestore-data-model | 2/2 | 4 min | 2 min |
| 02-business-crud | 5/5 | 11 min | 2 min |
| 03-dynamic-business-context | 2/2 | 6 min | 3 min |
| 04-strip-hardcoded-content | 3/3 | 19 min | 6 min |
| 05-business-profile-section-config | 2/2 | 3 min | 2 min |
| 06-variable-library | 4/4 | 9 min | 2 min |
| 07-generic-scenario-engine | 4/4 | 12 min | 3 min |
| 08-business-aware-ai | 2/2 | 5 min | 3 min |
| 09-sharing-access | 3/3 | 8 min | 3 min |
| 10-dashboard-navigation | 1/1 | 5 min | 5 min |
| 11-export-updates | 2/2 | 10 min | 5 min |
| 12-integration-and-polish | 5/6 | 22 min | 4 min |

**Recent Trend:**
- Last 5 plans: 12-02 (3 min), 12-03 (4 min), 12-04 (6 min), 12-06 (7 min)
- Trend: Consistent execution velocity

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
| 05-02 | 500ms debounce timer for profile auto-save | Balances responsiveness with avoiding excessive Firestore writes |
| 05-02 | ChevronDown data-state attribute for CSS rotation | Leverages Radix data attributes rather than React state class toggling |
| 06-01 | Module-level Parser singleton for expr-eval | Reuse single parser instance across all formula evaluations |
| 06-01 | Only store dependsOn, derive dependents when needed | Avoids sync bugs from bidirectional dependency maintenance |
| 06-01 | Graceful degradation on formula errors (return 0) | Keeps UI functional; logs warning for debugging |
| 06-02 | Construct VariableDefinition objects directly (no helpers) | Plan 06-01 runs in parallel; direct construction avoids cross-plan dependency |
| 06-02 | Re-export getDefaultVariables as getTemplateVariables | Keeps template objects lean; consumers use existing business-templates.ts import point |
| 06-03 | Store variables as { definitions: Record } in state/variables doc | Avoids Firestore flattening individual variable objects; single field is atomic |
| 06-03 | Fire-and-forget Firestore saves with optimistic local updates | Same pattern as useBusinesses.updateProfile; keeps UI responsive |
| 06-03 | VariableLoader placed between BusinessLoader and ScenarioSync | Follows dependency order; variables need business context but are independent of scenarios |
| 06-04 | Evaluation result and error computed together in single useMemo | Avoids side effects inside useMemo; error state derived from computation |
| 06-04 | Percent values displayed as *100 in inputs, stored as decimals | Consistent with RESEARCH.md convention; user sees 30%, formula uses 0.30 |
| 06-04 | Add Variable form uses Collapsible from shadcn | Power-user feature hidden by default; keeps main UI clean |
| 07-01 | Purely additive: new atoms coexist with old hardcoded atoms | Old atoms remain until 07-04 cleanup; no breaking changes |
| 07-01 | evaluatedValuesAtom catches circular dependency errors | Falls back to raw .value from merged definitions on formula engine error |
| 07-02 | ScenarioSync gates init on variablesLoaded | Ensures variable definitions available when creating baseline defaults |
| 07-02 | Baseline default values from input-type variable definitions | Iterates businessVariablesAtom for input variables instead of DEFAULT_SCENARIO_VARIABLES |
| 07-03 | Keep export name ScenarioDashboard (not DynamicScenarioDashboard) | Minimizes downstream import changes in index.tsx |
| 07-03 | Flat 12-month chart projection (no ramp factors) | Ramp was Fun Box-specific; flat projection is generic |
| 07-03 | Semantic coloring by label pattern matching | Labels containing profit/margin/cost/revenue get appropriate colors |
| 07-04 | ScenarioComparison evaluates scenarios with evaluateVariables | Ad-hoc evaluation merges scenario.values into definitions |
| 07-04 | Dashboard primary/secondary KPIs from first 4/next 4 computed vars | Simple slicing provides consistent layout without hardcoded names |
| 07-04 | Export and AI migrated to evaluatedValuesAtom during cleanup | Prevents leaving dead references; completes migration in one pass |
| 07-04 | context-builder accepts Record<string, number> | Generic type replaces hardcoded ComputedMetrics interface |
| 08-01 | Backwards-compatible SYSTEM_INSTRUCTION via buildSystemPrompt with empty custom profile | Prevents consumer breaks before 08-02 wires real BusinessProfile |
| 08-01 | buildPrompt profile parameter is BusinessProfile or null | Graceful fallback during transition; null returns "Business profile not configured" |
| 08-01 | Metric formatting by VariableUnit: currency->$, percent->*100+%, count->rounded | Human-readable values in AI prompts instead of raw numbers |
| 08-02 | Only generate action gets industry overlays; improve/expand unchanged | Improve/expand work on existing data and don't need business-type-specific guidance |
| 08-02 | Custom business type has no overlays | Base prompts already generic; overlays only needed for specialized types |
| 08-02 | Fallback empty profile (type: custom, currency: USD) when no business active | Graceful degradation when AI used without configured business |
| 09-01 | Reusable invite links: invite stays active after acceptance | Multiple users can accept same link; no single-use fields needed |
| 09-01 | Doc ID is the token: crypto.randomUUID() for invite IDs | No separate token field; simplifies data model |
| 09-01 | No invite expiration for reusable links | Removes expiresAt field; owner can revoke instead |
| 09-01 | ALLOWED_EMAILS removed: Firestore roles as sole access control | Any authenticated user can use app; business access via roles map |
| 09-02 | Invite route in both auth branches | Unauthenticated users see sign-in on invite page; URL works regardless of auth state |
| 09-02 | ShareDialog loads invites on open, not on mount | Avoids unnecessary Firestore reads when dialog is not visible |
| 09-02 | UIDs displayed for members (not emails) | Roles map keys are UIDs; email resolution deferred to future enhancement |
| 09-03 | useCanEdit wraps AiActionBar at call sites | Keeps AiActionBar component presentation-only; role logic in consumers |
| 09-03 | Scenario controls accept disabled prop | Propagates to SliderInput/NumberInput for clean viewer disabling |
| 09-03 | Financial projections uses readOnly directly | No isPreview pattern in financial section; simpler direct check |
| 10-01 | Sort KPIs by unit type, not alphabetically | Currency metrics are most important at a glance |
| 10-01 | Limit chart to 3 currency variables | More than 3 series makes area charts unreadable |
| 10-01 | Label-based semantic color matching | Any business type gets appropriate colors without configuration |
| 10-01 | Read businessId from useParams | Dashboard within /business/:businessId route; URL is source of truth |
| 11-01 | Reuse Phase 10 unitPriority sorting pattern | Consistent KPI ordering across dashboard and export views |
| 11-01 | Keep all 9 useSection hooks unconditionally | React hooks can't be conditional; conditional rendering handles visibility |
| 11-02 | Top 4 metrics by unit priority on cover page | Currency metrics most impactful; consistent with dashboard/web view sorting |
| 11-02 | try/catch in PDF formatCurrency | @react-pdf/renderer runs in worker; graceful fallback prevents PDF generation failure |
| 11-02 | Sanitized business name in PDF filename | Safe filename from any business name input |
| 12-01 | CSS custom properties for shadows instead of Tailwind config | Keeps tokens colocated with existing OKLCH color system in index.css |
| 12-01 | Semantic chart color hex values alongside existing OKLCH chart vars | Different purpose: semantic data viz vs generic UI chrome |
| 12-02 | Radial dot-grid CSS background pattern for login page | Subtle depth without image assets |
| 12-02 | Per-type color accents for business cards (TYPE_COLOR_MAP) | Visual differentiation of business types at a glance |
| 12-02 | Colored circular icon backgrounds on template picker (TYPE_ICON_BG) | Dark mode-aware, consistent color mapping with card accents |
| 12-03 | Custom chart tooltip component instead of Recharts default | Ensures white bg even in dark mode for readability |
| 12-03 | Section link icons with unique colored circle backgrounds | Visual distinction between sections at a glance |
| 12-03 | Theme toggle moved into user dropdown menu | Reduces sidebar footer clutter, keeps minimal appearance |
| 12-03 | Grid layout for type/industry in header bar | Improves data density in collapsible settings panel |
| 12-04 | Subtle 2px border accents (left/top) instead of full colored backgrounds | Cleaner Stripe aesthetic for card visual hierarchy |
| 12-04 | CSS variable chart colors for Recharts fills | Uses --chart-profit, --chart-neutral from design system |
| 12-04 | HTML table element for competitor table | Better semantics, enables alternating row backgrounds |
| 12-04 | card-elevated div replacing Card/CardHeader/CardContent | Simpler DOM, consistent with design system patterns |
| 12-06 | Underline tabs pattern for scenario and export pages | Consistent dashboard-like feel across power-user tools |
| 12-06 | AlertDialog for scenario delete confirmation | Prevents accidental deletion with proper UX |
| 12-06 | CSS custom property chart colors in business-plan-view | var(--chart-revenue) etc for theme compatibility |
| 12-06 | Primary color tokens for AI preview replacing hardcoded purple | Theme-agnostic styling works with any color scheme |

### Deferred Issues

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 12-06-PLAN.md (Phase 12, plan 5 of 6)
Resume file: None
