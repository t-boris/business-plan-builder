// Effective Plan Composition Layer
// Pure functions for merging base section data + variant + overrides into a single "effective" section.
// No side effects, no atoms, no Firestore — designed for easy testing.

import type { DynamicScenario } from '@/types/scenario';

/**
 * Deep merge a section base with a partial overlay.
 *
 * Merge rules (matching Firestore's 2-level nesting limit):
 * - Arrays: overlay replaces entirely (not concatenated)
 * - Nested objects: recursive merge (one level deep only)
 * - null/undefined in overlay: skipped (base value preserved)
 * - Primitives: overlay replaces base
 */
export function deepMergeSection<T>(base: T, overlay: Partial<T>): T {
  const result = { ...base };

  for (const key of Object.keys(overlay) as (keyof T)[]) {
    const overlayValue = overlay[key];

    // Skip null/undefined — don't delete base fields
    if (overlayValue === null || overlayValue === undefined) {
      continue;
    }

    // Arrays: full replacement
    if (Array.isArray(overlayValue)) {
      result[key] = overlayValue as T[keyof T];
      continue;
    }

    // Nested objects: one-level recursive merge
    const baseValue = base[key];
    if (
      typeof overlayValue === 'object' &&
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = { ...(baseValue as object), ...(overlayValue as object) } as T[keyof T];
      continue;
    }

    // Primitives: direct replacement
    result[key] = overlayValue as T[keyof T];
  }

  return result;
}

/**
 * Compute the effective section data by composing base -> variant -> overrides.
 *
 * 1. Start with `base`
 * 2. If `variant` is provided, use it as the new base (full replacement)
 * 3. If `overrides` is provided, deep-merge on top of the effective base
 */
export function computeEffectiveSection<T>(
  base: T,
  variant: T | null,
  overrides: Partial<T> | null
): T {
  // Variant replaces the entire section when present
  let effective: T = variant ?? base;

  // Overrides are deep-merged on top
  if (overrides) {
    effective = deepMergeSection(effective, overrides);
  }

  return effective;
}

/**
 * Resolve an entire plan's effective sections by applying the active scenario's
 * variant refs and section overrides to each base section.
 *
 * For each section slug:
 * - Look up variantRefs[slug] -> use variants[variantId] as variant data
 * - Look up sectionOverrides[slug] -> use as overrides
 * - Call computeEffectiveSection(base, variant, overrides)
 *
 * Returns the full effective plan as Record<sectionSlug, effectiveSectionData>.
 */
export function resolveEffectivePlan(config: {
  baseSections: Record<string, unknown>;
  activeScenario: DynamicScenario;
  variants: Record<string, unknown>;
}): Record<string, unknown> {
  const { baseSections, activeScenario, variants } = config;
  const result: Record<string, unknown> = {};

  for (const slug of Object.keys(baseSections)) {
    const base = baseSections[slug];

    // Look up variant via variantRefs
    const variantId = activeScenario.variantRefs?.[slug];
    const variant = variantId ? (variants[variantId] ?? null) : null;

    // Look up section overrides
    const overrides = activeScenario.sectionOverrides?.[slug] ?? null;

    result[slug] = computeEffectiveSection(
      base,
      variant as typeof base | null,
      overrides as Partial<typeof base> | null
    );
  }

  return result;
}
