# Phase 2: Business CRUD - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<vision>
## How This Should Work

The app opens to a business list page — always. This is home base. Each business shows as a card with name, type, and a completion status indicator so you can see how much of the plan is filled out at a glance.

**Creating a business:** Click "New Business" and you get a clean form: name, pick a business type, brief description. The type selection is the star — template cards with icons, descriptions, and a preview of what sections and variables come with that type. It should feel like picking a template, not filling a boring dropdown. Once you confirm, you're dropped into the new business immediately.

**Business list (home):** Cards layout showing all your businesses. Name + type + completion progress. First-time users see a friendly welcome message with a prominent "Create your first business plan" button — not a sad empty state.

**Switching businesses:** When you're inside a business, the sidebar has a dropdown with the business name. Click it to switch to another business without going back to the list. Quick and seamless.

**Deleting a business:** Type the business name to confirm — GitHub-style safety. This is serious data, not a throwaway action.

**Flexibility:** Business type is changeable after creation. You can switch type or modify which sections/variables are active at any time. When changing type, all existing data is preserved in the database — sections that don't apply to the new type are hidden but never deleted. New sections appear empty and ready to fill.

</vision>

<essential>
## What Must Be Nailed

- **All CRUD operations equally solid** — create, list, switch, delete all need to work well, no weak links
- **Business list as home** — always land here, clear overview of all businesses with completion status
- **Template-style type picker** — creating a business should feel like picking a template with rich preview cards
- **Sidebar dropdown for switching** — never lose context, always one click away from another business
- **Safe deletion** — type business name to confirm, GitHub-style
- **Data preservation** — changing business type never deletes data, only shows/hides sections

</essential>

<specifics>
## Specific Ideas

- Template cards with icon + description + section preview when picking business type
- Welcome message + "Create your first business plan" button for empty state
- Completion status indicator on business cards (how much of the plan is filled)
- Sidebar business switcher dropdown (not just a back button)
- Type-to-confirm deletion pattern (like GitHub repo deletion)
- Business type and sections changeable after creation — all data always saved to DB, hidden sections retain their data

</specifics>

<notes>
## Additional Context

The user wants this to feel fast and low-friction. No wizard flows — just a simple form with rich type selection. The business list is the true home of the app, not an individual business view.

The flexibility point is key: business type is not a permanent choice. Users should be able to experiment and change their mind without fear of losing work. This means the data model should decouple "what's visible" from "what's stored."

</notes>

---

*Phase: 02-business-crud*
*Context gathered: 2026-02-11*
