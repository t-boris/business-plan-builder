---
phase: 11-export-updates
plan: 02
status: complete
duration: 5 min
commits: [4aa6a01, 8e16880]
---

## What was done

### Task 1: Dynamic PDF document with business-aware sections and cover page
- Updated `GeneratePdfParams` with `enabledSections`, `scenarioMetrics`, `businessName`, `currencyCode`
- CoverPage accepts dynamic `topMetrics` array instead of hardcoded metric props
- CoverPage displays `businessName` as title with "Business Plan" subtitle
- BusinessPlanDocument filters sections by `enabledSlugs` with dynamic numbering
- Dynamic cover page KPIs sorted by unit priority (currency first, then percent)
- `formatCurrency` accepts currency code with try/catch fallback
- Removed legacy hardcoded `monthlyRevenue`/`monthlyProfit` destructuring
- Financial Projections section uses dynamic metric cards from `scenarioMetrics`
- Monthly P&L table conditional on `financials.months.length > 0`

### Task 2: Update Export page to pass business-aware data
- Imported `activeBusinessAtom` and `businessVariablesAtom`
- Built dynamic `scenarioMetrics` from computed evaluated variables via `useMemo`
- Derived `businessName`, `currencyCode`, `enabledSections` from active business
- Passed all new fields to `generateBusinessPlanPdf`
- PDF filename includes sanitized business name
- Updated info text from "all 9 sections" to "all enabled sections"
- Updated pdfStyles for dynamic metric card rendering

## Decisions

| Decision | Rationale |
|----------|-----------|
| Top 4 metrics by unit priority on cover page | Currency metrics most impactful; consistent with dashboard/web view sorting |
| try/catch in PDF formatCurrency | @react-pdf/renderer runs in worker; graceful fallback prevents PDF generation failure |
| Sanitized business name in PDF filename | Safe filename from any business name input |

## Verification

- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm run build` succeeds
- [x] CoverPage shows business name and dynamic KPIs
- [x] BusinessPlanDocument renders only enabled sections
- [x] Dynamic section numbering in PDF
- [x] Currency propagated to all formatCurrency calls
- [x] Export page passes all business-aware data
- [x] PDF filename includes business name
- [x] No hardcoded metric lookups remain
