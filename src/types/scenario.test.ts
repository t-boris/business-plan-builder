import { describe, it, expect } from 'vitest';
import { normalizeScenario } from './scenario';
import type { DynamicScenario } from './scenario';

describe('normalizeScenario', () => {
  it('normalizes null/undefined to empty scenario with defaults', () => {
    const result = normalizeScenario(null);

    expect(result.metadata).toBeDefined();
    expect(result.metadata.id).toBeTruthy();
    expect(result.metadata.name).toBe('Untitled Scenario');
    expect(result.metadata.description).toBe('');
    expect(result.metadata.createdAt).toBeTruthy();
    expect(result.metadata.isBaseline).toBe(false);
    expect(result.values).toEqual({});
    expect(result.assumptions).toEqual([]);
    expect(result.variantRefs).toEqual({});
    expect(result.sectionOverrides).toEqual({});
    expect(result.status).toBe('draft');
    expect(result.horizonMonths).toBe(12);

    // undefined should produce the same shape
    const result2 = normalizeScenario(undefined);
    expect(result2.metadata.id).toBeTruthy();
    expect(result2.values).toEqual({});
    expect(result2.assumptions).toEqual([]);
  });

  it('normalizes old v1 scenario (values-only) to v2 with defaults', () => {
    const v1Input = {
      metadata: {
        id: 'v1-id',
        name: 'Old Scenario',
        description: 'A v1 scenario',
        createdAt: '2026-01-01T00:00:00Z',
        isBaseline: true,
      },
      values: { revenue: 50000, costs: 20000 },
    };

    const result = normalizeScenario(v1Input);

    // Original fields preserved
    expect(result.metadata).toEqual(v1Input.metadata);
    expect(result.values).toEqual(v1Input.values);

    // v2 defaults applied
    expect(result.assumptions).toEqual([]);
    expect(result.variantRefs).toEqual({});
    expect(result.sectionOverrides).toEqual({});
    expect(result.status).toBe('draft');
    expect(result.horizonMonths).toBe(12);
  });

  it('passes through complete v2 scenario unchanged', () => {
    const v2Input: DynamicScenario = {
      metadata: {
        id: 'v2-id',
        name: 'Full Scenario',
        description: 'All fields populated',
        createdAt: '2026-02-01T00:00:00Z',
        isBaseline: false,
      },
      values: { revenue: 100000 },
      assumptions: [
        { id: 'a1', label: 'Growth Rate', value: '10%', category: 'financial' },
      ],
      variantRefs: { 'product-service': 'variant-1' },
      sectionOverrides: { 'product-service': { overview: 'Custom overview' } },
      status: 'active',
      horizonMonths: 24,
    };

    const result = normalizeScenario(v2Input);

    expect(result).toEqual(v2Input);
  });

  it('handles partial v2 (some fields present, others missing)', () => {
    const partialInput = {
      metadata: {
        id: 'partial-id',
        name: 'Partial Scenario',
        description: '',
        createdAt: '2026-02-10T00:00:00Z',
        isBaseline: false,
      },
      values: { price: 99 },
      assumptions: [
        { id: 'a1', label: 'Market Size', value: '1M', category: 'market' },
      ],
      // No variantRefs, no sectionOverrides, no status, no horizonMonths
    };

    const result = normalizeScenario(partialInput);

    // Provided fields preserved
    expect(result.assumptions).toEqual(partialInput.assumptions);
    expect(result.values).toEqual(partialInput.values);

    // Missing v2 fields get defaults
    expect(result.variantRefs).toEqual({});
    expect(result.sectionOverrides).toEqual({});
    expect(result.status).toBe('draft');
    expect(result.horizonMonths).toBe(12);
  });

  it('preserves existing metadata fields', () => {
    const input = {
      metadata: {
        id: 'keep-this-id',
        name: 'Keep This Name',
        description: 'Keep this description',
        createdAt: '2025-06-15T12:00:00Z',
        isBaseline: true,
      },
      values: {},
    };

    const result = normalizeScenario(input);

    expect(result.metadata.id).toBe('keep-this-id');
    expect(result.metadata.name).toBe('Keep This Name');
    expect(result.metadata.description).toBe('Keep this description');
    expect(result.metadata.createdAt).toBe('2025-06-15T12:00:00Z');
    expect(result.metadata.isBaseline).toBe(true);
  });
});
