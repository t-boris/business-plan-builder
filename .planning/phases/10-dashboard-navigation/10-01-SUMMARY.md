---
phase: 10-dashboard-navigation
plan: 01
started: 2026-02-11T12:00:00Z
completed: 2026-02-11T12:30:00Z
---

## What Was Done

Rewrote the dashboard component to be genuinely useful for any business type. KPI cards are now sorted by unit priority (currency first, then percent, then count/time), the chart dynamically adapts to whatever currency variables exist with semantic color matching, section links are filtered by enabled sections, and all navigation uses business-scoped URLs.

## Tasks Completed

### Task 1: Smart KPI cards and dynamic chart

Replaced the naive `computedVariables.slice(0, 4)` approach with priority-based sorting using a `unitPriority` map (currency=0, percent=1, ratio=2, count=3, months=4, days=5, hours=6). Top 4 sorted variables become primary KPIs (large cards), next 4 become secondary KPIs (small cards).

Replaced hardcoded `monthly_revenue`/`monthly_costs` chart lookup with dynamic series selection: finds up to 3 currency-type variables and assigns semantic colors based on label matching (green for revenue/income/sales, orange for cost/expense/spend, blue for profit/net/margin, slate for default).

Added empty state card with "Configure Scenarios" link when no computed variables exist. Updated `formatCurrency` and `formatValue` to accept a `currencyCode` parameter read from `business.profile.currency`. Chart title updated to generic "12-Month Financial Projection".

### Task 2: Filter section links by enabled sections with business-scoped URLs

Added `enabledLinks` memo that filters `SECTION_LINKS` by `business.enabledSections`, stripping the leading `/` from each URL slug for comparison. Section links grid is conditionally rendered only when `enabledLinks.length > 0`.

All dashboard links now use business-scoped URLs with `/business/${businessId}/` prefix: scenario badge, empty state link, and all section card links. The `businessId` is read from `useParams`.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Sort KPIs by unit type, not alphabetically | Currency metrics (revenue, costs, profit) are the most important at a glance |
| Limit chart to 3 currency variables | More than 3 series makes area charts unreadable |
| Use label-based semantic color matching | Allows any business type's variables to get appropriate colors without configuration |
| Read `businessId` from `useParams` | Dashboard is always rendered within `/business/:businessId` route, so URL params are the source of truth |
| Hide section grid when no sections enabled | Avoids showing an empty "Business Plan Sections" header with no content |

## Commits

- `90a1311` feat(10-01): smart KPI cards and dynamic chart
- `9b50772` feat(10-01): filter section links by enabled sections with business-scoped URLs

## Verification

- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm run build` succeeds
- [x] KPI cards sorted by unit priority (currency -> percent -> other)
- [x] Chart dynamically shows currency-type variables with semantic colors
- [x] Chart hidden when no currency variables exist
- [x] Empty state shown when no computed variables exist
- [x] Section links filtered by `enabledSections`
- [x] All dashboard links include `/business/${businessId}/` prefix
- [x] Currency formatting uses business profile currency
