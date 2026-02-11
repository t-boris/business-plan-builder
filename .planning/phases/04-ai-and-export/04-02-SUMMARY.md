---
phase: 04-ai-and-export
plan: 02
subsystem: ui, export
tags: [react-pdf, html2canvas, file-saver, recharts, pdf-export, business-plan-view]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: dashboard shell, routing, Firestore data model
  - phase: 02-business-plan-sections
    provides: all 9 section types, useSection hook, section default data
  - phase: 03-what-if-engine
    provides: scenario atoms, derived metrics atoms, computeDerivedMetrics
provides:
  - polished read-only business plan view with all 9 sections
  - PDF export with professional formatting, cover page, all sections
  - chart-to-image capture via html2canvas
  - lazy-loaded PDF generation (no initial bundle impact)
affects: []

# Tech tracking
tech-stack:
  added: ["@react-pdf/renderer ^4.3.2", "html2canvas ^1.4.1", "file-saver ^2.0.5", "@types/file-saver"]
  patterns: ["lazy-loaded PDF generation via dynamic import", "chart capture with html2canvas", "read-only business plan view reusing useSection hook"]

key-files:
  created:
    - src/features/export/business-plan-view.tsx
    - src/features/export/pdf/pdfStyles.ts
    - src/features/export/pdf/PageFooter.tsx
    - src/features/export/pdf/CoverPage.tsx
    - src/features/export/pdf/SectionPage.tsx
    - src/features/export/pdf/BusinessPlanDocument.tsx
    - src/features/export/pdf/useChartCapture.ts
    - src/features/export/pdf/generatePdf.ts
  modified:
    - src/features/export/index.tsx
    - package.json

key-decisions:
  - "html2canvas instead of recharts-to-png for chart capture -- more reliable with Recharts v3"
  - "Dynamic import for all PDF dependencies -- keeps initial bundle clean"
  - "BusinessPlanView props for chart ref and animation control -- enables PDF capture from visible chart"

issues-created: []

# Metrics
duration: 8min
completed: 2026-02-11
---

# Phase 4 Plan 2: Business Plan View & PDF Export Summary

**Polished read-only business plan view displaying all 9 sections with scenario integration, plus professional multi-page PDF export with cover page, financial charts, tables, and page numbers via @react-pdf/renderer**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-11T16:51:48Z
- **Completed:** 2026-02-11T16:59:50Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Built polished read-only business plan view with all 9 sections, scenario KPI stats, financial chart, and table of contents with anchor links
- Implemented professional PDF export using @react-pdf/renderer with cover page, all 9 sections, tables, stat cards, chart image, and page numbers
- Achieved zero initial bundle impact through lazy-loading of PDF dependencies (react-pdf 1.57MB + html2canvas 201KB loaded only on demand)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build polished read-only business plan view** - `316fdc5` (feat)
2. **Task 2: Implement PDF export with @react-pdf/renderer** - `584e2e0` (feat)

## Files Created/Modified
- `src/features/export/business-plan-view.tsx` - Read-only business plan view with all 9 sections, scenario metrics, financial chart
- `src/features/export/index.tsx` - Tabbed export page with Business Plan view and PDF download
- `src/features/export/pdf/pdfStyles.ts` - Shared PDF stylesheet (A4, Helvetica, professional formatting)
- `src/features/export/pdf/PageFooter.tsx` - Fixed footer with page numbers
- `src/features/export/pdf/CoverPage.tsx` - Cover page with title, date, scenario badge, key metrics
- `src/features/export/pdf/SectionPage.tsx` - Reusable section page with numbered headers and bookmarks
- `src/features/export/pdf/BusinessPlanDocument.tsx` - Main PDF document rendering all 9 sections
- `src/features/export/pdf/useChartCapture.ts` - Hook for capturing Recharts chart as PNG via html2canvas
- `src/features/export/pdf/generatePdf.ts` - PDF generation orchestrator with lazy loading

## Decisions Made
- Used html2canvas instead of recharts-to-png for chart capture (more reliable with Recharts v3, html2canvas is also the underlying dependency of recharts-to-png)
- All PDF dependencies loaded via dynamic import() to avoid ~1.8MB initial bundle increase
- BusinessPlanView passes chartContainerRef to enable chart capture from the visible in-app chart rather than requiring a hidden duplicate

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used html2canvas directly instead of recharts-to-png**
- **Found during:** Task 2 (PDF export implementation)
- **Issue:** recharts-to-png v3 uses html2canvas internally anyway; using it directly is simpler and avoids potential compatibility issues with Recharts v3
- **Fix:** Installed html2canvas directly, created useChartCapture hook using it
- **Files modified:** package.json, src/features/export/pdf/useChartCapture.ts
- **Verification:** Build succeeds, chart capture code compiles correctly
- **Committed in:** 584e2e0

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor library substitution using the underlying dependency directly. No scope creep.

## Issues Encountered
None

## Next Phase Readiness
- Phase 4 complete (both plans executed: AI integration + export)
- All 4 phases of the project are now complete
- Ready for milestone completion

---
*Phase: 04-ai-and-export*
*Completed: 2026-02-11*
