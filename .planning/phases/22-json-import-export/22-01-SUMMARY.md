# 22-01 Summary: JSON Import/Export for Business Plans

## Completed

- Created `src/lib/business-json.ts` with:
  - `exportBusinessData()` — reads all sections, variables, scenarios, profile from Firestore
  - `downloadJson()` — triggers browser file download from JSON data
  - `generateExportSchema()` — returns JSON Schema (draft-07) describing the export format
  - `importBusinessData()` — writes bundle data back to Firestore (profile, sections, variables, scenarios)
  - `validateExportBundle()` — type guard for import validation
  - `BusinessExportBundle` interface (version, exportedAt, profile, enabledSections, sections, variables, scenarios)

- Modified `src/components/app-sidebar.tsx`:
  - Added Export Data, Export Schema, Import Data items to business switcher dropdown
  - Owner-only access (hidden for editors/viewers)
  - File input with validation, confirmation dialog, and full page reload after import

## Commits

- `f99faf9` feat(22-01): add JSON import/export for business plans

## Verification

- `npx vite build` — passed
- `npx vitest run` — 122 tests passed
- `npx eslint` — clean on changed files

## Decisions

- Import is additive for scenarios (doesn't delete existing ones not in bundle) to prevent data loss
- Export includes raw Firestore section data (not scenario-blended effective data)
- Image URLs are included as-is (Firebase Storage URLs point to original business's storage)
- Full page reload after import to ensure all atoms/hooks pick up new data
