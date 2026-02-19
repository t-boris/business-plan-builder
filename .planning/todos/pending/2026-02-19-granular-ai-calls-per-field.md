---
created: 2026-02-19T12:00
title: Make AI calls field-specific instead of whole-tab
area: ai
files:
  - src/hooks/use-ai-suggestion.ts
  - src/lib/ai/section-prompts.ts
  - src/features/sections/*/index.tsx
---

## Problem

Currently the AI "Generate / Improve / Expand" actions operate on an entire section tab at once (e.g. the whole Marketing Strategy object). This is coarse-grained — the user may only want AI to write a description for one channel, or generate an overview paragraph, or fill in tactics for a single offering.

The whole-tab approach:
- Overwrites fields the user already filled in carefully
- Uses more tokens than necessary
- Gives less targeted results
- Makes the preview diff hard to review (everything changes)

## Solution

TBD — high-level direction:

1. Audit every section that uses `useAiSuggestion` and identify which sub-fields benefit from per-field AI (descriptions, overviews, tactics, risk mitigations, etc.)
2. Add a field-level AI trigger (e.g. small sparkle icon next to text fields) that generates only that field's content, using the rest of the section as context
3. Keep the whole-tab Generate as an option for empty sections, but default UX to per-field
4. Update `section-prompts.ts` schemas to support partial generation (single field output)
