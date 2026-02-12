---
phase: 11-export-updates
plan: 01
status: complete
duration: 5 min
commits: [244d71f]
---

## What was done

### Task 1: Dynamic sections, business identity, and currency
- Imported `activeBusinessAtom` and `businessVariablesAtom` from business atoms
- Filtered sections by `business.enabledSections` with fallback to all `SECTION_SLUGS`
- Dynamic section numbering via `getSectionNumber()` helper
- Business name in header and footer, currency from `business.profile.currency`
- `formatCurrency` accepts currency code parameter with fallback to USD
- Table of contents reflects only enabled sections
- All 9 section blocks wrapped in `enabledSections.includes()` conditionals

### Task 2: Dynamic KPI cards and financial chart from evaluated values
- Removed hardcoded `monthly_revenue`, `monthly_profit`, `profitMargin`, `monthlyBookings`, `annualRevenue` lookups
- Dynamic KPI cards from `computedVariables` sorted by `unitPriority` (currency > percent > ratio > count > months > days > hours)
- Dynamic financial chart from up to 3 currency-type variables with semantic coloring
- Removed legacy `sumCosts` function and hardcoded chart data
- Monthly P&L table conditional on `financials.months.length > 0`
- Unit Economics conditional on non-zero values
- Removed hardcoded annual revenue from footer

## Decisions

| Decision | Rationale |
|----------|-----------|
| Reuse Phase 10 unitPriority sorting pattern | Consistent KPI ordering across dashboard and export views |
| Semantic color matching by label pattern | Same as dashboard; any business type gets appropriate chart colors |
| Keep all 9 useSection hooks unconditionally | React hooks can't be conditional; conditional rendering handles visibility |

## Verification

- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm run build` succeeds
- [x] Only enabled sections render
- [x] Dynamic section numbering
- [x] Business name in header/footer
- [x] Currency from business profile
- [x] Dynamic KPI cards from evaluated values
- [x] Dynamic chart from currency variables
- [x] No hardcoded metric lookups remain
