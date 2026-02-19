import { describe, it, expect } from 'vitest';
import { deepMergeSection, computeEffectiveSection } from './effective-plan';

describe('deepMergeSection', () => {
  it('merges flat objects — overlay fields replace base', () => {
    const base = { a: 1, b: 2 };
    const overlay = { b: 3, c: 4 };

    const result = deepMergeSection(base, overlay);

    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('merges nested objects one level deep', () => {
    const base = { x: { a: 1, b: 2 } };
    const overlay = { x: { b: 3 } };

    const result = deepMergeSection(base, overlay);

    expect(result).toEqual({ x: { a: 1, b: 3 } });
  });

  it('overlay arrays replace base arrays (not concatenate)', () => {
    const base = { items: [1, 2, 3] };
    const overlay = { items: [4, 5] };

    const result = deepMergeSection(base, overlay);

    expect(result).toEqual({ items: [4, 5] });
  });

  it('skips undefined overlay values', () => {
    const base = { a: 1, b: 2 };
    const overlay = { a: undefined, b: 3 };

    const result = deepMergeSection(base, overlay);

    expect(result).toEqual({ a: 1, b: 3 });
  });

  it('handles empty overlay (returns base)', () => {
    const base = { a: 1 };
    const overlay = {};

    const result = deepMergeSection(base, overlay);

    expect(result).toEqual({ a: 1 });
  });
});

describe('computeEffectiveSection', () => {
  it('returns base when no variant or overrides', () => {
    const base = { name: 'Base', price: 100 };

    const result = computeEffectiveSection(base, null, null);

    expect(result).toEqual(base);
  });

  it('variant replaces base entirely', () => {
    const base = { name: 'Base', price: 100 };
    const variant = { name: 'Variant', price: 200 };

    const result = computeEffectiveSection(base, variant, null);

    expect(result).toEqual(variant);
  });

  it('overrides merge on top of base', () => {
    const base = { name: 'Base', price: 100, description: 'Original' };
    const overrides = { price: 150 };

    const result = computeEffectiveSection(base, null, overrides);

    expect(result).toEqual({ name: 'Base', price: 150, description: 'Original' });
  });

  it('overrides merge on top of variant (not base)', () => {
    const base = { name: 'Base', price: 100, description: 'Base desc' };
    const variant = { name: 'Variant', price: 200, description: 'Variant desc' };
    const overrides = { description: 'Override desc' };

    const result = computeEffectiveSection(base, variant, overrides);

    expect(result).toEqual({ name: 'Variant', price: 200, description: 'Override desc' });
  });

  it('realistic ProductService scenario', () => {
    const base = {
      overview: 'Base overview',
      offerings: [
        { id: 'o1', name: 'Basic', price: 100, description: 'Basic offering' },
        { id: 'o2', name: 'Premium', price: 300, description: 'Premium offering' },
      ],
      addOns: [{ id: 'a1', name: 'Rush', price: 50 }],
    };

    const variant = {
      overview: 'Variant overview',
      offerings: [
        { id: 'o1', name: 'Basic v2', price: 120, description: 'Updated basic' },
        { id: 'o3', name: 'Enterprise', price: 500, description: 'Enterprise tier' },
      ],
      addOns: [{ id: 'a2', name: 'Priority', price: 75 }],
    };

    const overrides = { overview: 'New overview' };

    const result = computeEffectiveSection(base, variant, overrides);

    // Variant offerings are used (not base)
    expect(result.offerings).toEqual(variant.offerings);
    // Variant addOns are used (not base)
    expect(result.addOns).toEqual(variant.addOns);
    // Overview is overridden on top of variant
    expect(result.overview).toBe('New overview');
  });
});
