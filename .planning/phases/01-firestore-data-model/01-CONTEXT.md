# Phase 1: Firestore Data Model - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<vision>
## How This Should Work

Each business is its own completely independent world — sections, scenarios, variables, settings. No data shared between businesses, no leakage risk.

When creating a new business, the user picks a business type template (restaurant, SaaS, manufacturing, etc.) that pre-fills everything: sections, variables, defaults, and AI context. Templates themselves live in Firestore (not code), so adding a new business type is just adding a document — no code changes needed.

The section system is a hybrid: core sections shared across all business types (executive summary, market analysis, financials, etc.) plus type-specific sections (Supply Chain for manufacturing, MRR for SaaS). Custom sections can also be AI-generated — when a user says "I need a Supply Chain section," AI creates a comprehensive, fully-filled section based on the business context. After creation, every element is editable: add sub-sections, delete sections, modify fields.

Sections are stored as flexible dynamic JSON structures in Firestore. Each section can have different fields, sub-sections, and lists. The schema is defined per section, not hardcoded in TypeScript types. But the UI feel is structured forms — clean inputs, organized fields, clear labels — like a financial application, not a document editor.

Variables have relationships — they can depend on each other (e.g., `total cost = materials + labor + shipping`). The data model needs to capture these dependency relationships so derived metrics compute correctly for any business type.

6 business type templates for v1:
1. **SaaS / Software** — MRR, churn, CAC/LTV, ARR
2. **Service / Consulting** — hourly/project billing, utilization, margins
3. **Retail / E-commerce** — products, inventory, margins, shipping
4. **Restaurant / Food Service** — seats, turns, tickets, food cost
5. **Event / Entertainment** — bookings, seasonal, venue costs
6. **Manufacturing Startup** — production, logistics, multi-country shipping, taxes, R&D, IP/patents

The manufacturing template is critical — it needs to model: production costs (who makes what parts, in-house vs delegated), supply chain logistics, cross-border shipping/customs/duties, R&D budgets, patent costs, and multi-country operations. Research needed during next phases for comprehensive manufacturing business plan variables.

Scenarios have no preset templates — each template just defines the variables, and users build their own scenarios from scratch.

</vision>

<essential>
## What Must Be Nailed

- **Clean isolation** — each business's data is completely separate, no risk of cross-contamination. Foundation must be rock solid.
- **Extensibility** — the data model must be easy to extend. Adding new section types, new variable types, new templates — all without code changes (Firestore-driven templates).
- **Flexible section schema** — sections are dynamic JSON structures, not rigid TypeScript types. Core sections and AI-generated custom sections use the same flexible storage format.
- **Variable relationships** — variables can depend on each other with defined formulas/relationships. This is the backbone of the scenario calculator.
- **Template-as-document** — business type templates are Firestore documents, not hardcoded. Adding a new business type = adding a document.

</essential>

<specifics>
## Specific Ideas

- Templates stored as Firestore documents (collection `templates/` or similar), each defining: business type name, default sections (with schema), default variables (with relationships), AI system prompt context
- Each business document contains: profile (name, type, location, description), enabled sections, section data, scenarios, variables, sharing config
- Manufacturing template must account for: multi-country production, delegated vs in-house manufacturing, logistics/shipping costs, customs/duties, R&D, patent/IP tracking
- AI-generated sections should be stored in the same flexible format as pre-defined sections, so they're indistinguishable after creation
- The UI for sections is structured forms, not document-like editing

</specifics>

<notes>
## Additional Context

User emphasized this is a **financial calculator first, document editor second**. Numbers, scenarios, and variable relationships are the primary value. Text sections are secondary support.

The manufacturing startup use case (guitar pickups) is a real validation case — the system must handle complex production/logistics/R&D scenarios with many variables and dependencies.

User wants to research manufacturing business plan best practices during the next phase (research) to inform what variables and sections the manufacturing template needs.

The app should feel like a well-designed financial application with clean structured forms, not like Notion or a document editor.

</notes>

---

*Phase: 01-firestore-data-model*
*Context gathered: 2026-02-11*
