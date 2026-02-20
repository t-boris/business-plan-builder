# Phase 22: JSON Import/Export for Business Plans - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<vision>
## How This Should Work

Export and import live in the business settings menu — a simple action, not a separate page. User clicks "Export", gets a complete JSON file downloaded. Clicks "Import", uploads a JSON file, and it overwrites the current business data.

Two export options:
1. **Export Business Data** — Complete snapshot: all sections, scenarios, variables, profile, settings. Everything needed to fully restore the business.
2. **Export JSON Schema** — A schema document describing the full data structure (all section types, scenario format, variable definitions). Useful for understanding the data model or building integrations.

Import reads a JSON file and overwrites the current business — a restore/update operation, not a clone.

</vision>

<essential>
## What Must Be Nailed

- **Complete export** — Every piece of data: all 9+ sections, all scenarios (with variants, overrides, assumptions), variables, business profile, settings. Nothing missing.
- **Clean overwrite on import** — Import replaces the current business data reliably. No merge confusion.
- **Schema export** — Separate action that exports a JSON schema describing the full data structure.

</essential>

<specifics>
## Specific Ideas

- Access from business settings menu (not sidebar, not a separate page)
- Export downloads a `.json` file immediately
- Import uploads a `.json` file and overwrites current business
- Schema export is a separate button/action alongside data export

</specifics>

<notes>
## Additional Context

No additional notes.

</notes>

---

*Phase: 22-json-import-export*
*Context gathered: 2026-02-19*
