# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** Interactive what-if scenario modeling that lets the owner see how changing any business variable ripples through the entire business plan in real time.
**Current focus:** Phase 3 — What-If Engine

## Current Position

Phase: 3 of 4 (What-If Engine)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-11 — Completed 03-01-PLAN.md

Progress: ███████░░░ 70%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 3 min
- Total execution time: 24 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3/3 | 12 min | 4 min |
| 2. Business Plan Sections | 3/3 | 9 min | 3 min |
| 3. What-If Engine | 1/2 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 4 min, 3 min, 3 min, 3 min, 3 min
- Trend: Stable (~3 min)

## Accumulated Context

### Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | Vite 7.3.1 (not 6.x) | create-vite@8.3.0 ships Vite 7.3.1 |
| 01-01 | shadcn/ui new-york style | Default style from shadcn init |
| 01-01 | Path alias in root tsconfig.json | Required for shadcn/ui alias detection |
| 01-02 | shadcn/ui Sidebar collapsible="icon" | Desktop icon-only collapse mode for sidebar |
| 01-02 | Feature-based directory structure | src/features/{name}/index.tsx for all page components |
| 01-02 | Three sidebar groups | Overview, Business Plan (9 items), Tools |
| 01-03 | Firestore subcollection paths | plans/{planId}/sections/{slug} and plans/{planId}/scenarios/{id} |
| 01-03 | Equal distribution for avgCheck | Simple average of 3 package prices until booking mix data available |
| 01-03 | Crew hourly rate $20, 4 hrs/event | Derived from PROJECT.md labor cost data for derived atom calculations |
| 02-01 | useSection exposes updateData callback | Needed for nested state mutations beyond simple field updates |
| 02-01 | Conversion rate: decimal storage, % display | Stored as 0.2, displayed as 20% with bidirectional conversion |
| 02-01 | CSS grid for competitors table | Simpler than DataTable for 3-5 rows |
| 02-02 | Channel names via display lookup map | Fixed categories (Meta Ads, Google Ads, etc.) not editable |
| 02-02 | Amber badges for safety protocol numbering | Protocols are text descriptions, not boolean completion items |
| 02-02 | Vertical CSS timeline for Launch Plan | Border connecting line with primary-colored dots for stage hierarchy |
| 02-03 | Recharts Tooltip Number() cast for v3 | Recharts v3 Tooltip formatter value is `number | undefined`, needs cast |
| 02-03 | Risk severity badge color scheme | bg-red-100/bg-amber-100/bg-green-100 for high/medium/low distinctness |
| 02-03 | Break-even from $2200 fixed marketing cost | Monthly marketing as baseline fixed cost for unit economics calculation |
| 03-01 | Explicit atom<number> type annotations | as const defaults cause literal type inference, breaking SetStateAction compatibility |
| 03-01 | Ramp-pattern 12-month projection | 40%-100% over 4 months more realistic than flat-line |
| 03-01 | Offline-first Firestore with amber indicator | Graceful degradation allows full in-memory scenario functionality |

### Deferred Issues

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed 03-01-PLAN.md — Phase 3 in progress, ready for 03-02
Resume file: None
