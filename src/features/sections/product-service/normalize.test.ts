import { describe, it, expect } from 'vitest';
import { normalizeProductService } from './normalize';

describe('normalizeProductService', () => {
  it('returns default for empty/null input', () => {
    expect(normalizeProductService(null)).toEqual({
      overview: '',
      offerings: [],
      addOns: [],
    });

    expect(normalizeProductService(undefined)).toEqual({
      overview: '',
      offerings: [],
      addOns: [],
    });

    expect(normalizeProductService({})).toEqual({
      overview: '',
      offerings: [],
      addOns: [],
    });
  });

  it('normalizes legacy packages to offerings', () => {
    const legacy = {
      packages: [
        {
          name: 'Basic Party',
          price: 200,
          duration: '2 hours',
          maxParticipants: 10,
          includes: ['Decorations', 'Cake'],
          description: 'A fun basic party.',
        },
        {
          name: 'Premium Party',
          price: 500,
          duration: '3 hours',
          maxParticipants: 25,
          includes: ['DJ', 'Catering', 'Decorations'],
          description: 'The ultimate experience.',
        },
      ],
    };

    const result = normalizeProductService(legacy);

    expect(result.offerings).toHaveLength(2);

    // First offering
    expect(result.offerings[0].name).toBe('Basic Party');
    expect(result.offerings[0].price).toBe(200);
    expect(result.offerings[0].priceLabel).toBe('2 hours');
    expect(result.offerings[0].description).toContain('A fun basic party.');
    expect(result.offerings[0].description).toContain('\u2022 Decorations');
    expect(result.offerings[0].description).toContain('\u2022 Cake');
    expect(result.offerings[0].addOnIds).toEqual([]);
    expect(result.offerings[0].id).toBeTruthy();

    // Second offering
    expect(result.offerings[1].name).toBe('Premium Party');
    expect(result.offerings[1].price).toBe(500);
    expect(result.offerings[1].priceLabel).toBe('3 hours');
    expect(result.offerings[1].description).toContain('The ultimate experience.');
    expect(result.offerings[1].description).toContain('\u2022 DJ');
    expect(result.offerings[1].description).toContain('\u2022 Catering');
    expect(result.offerings[1].description).toContain('\u2022 Decorations');
    expect(result.offerings[1].id).toBeTruthy();
  });

  it('normalizes legacy addOns with id generation', () => {
    const legacy = {
      packages: [],
      addOns: [
        { name: 'Photography', price: 100 },
        { name: 'Videography', price: 150 },
      ],
    };

    const result = normalizeProductService(legacy);

    expect(result.addOns).toHaveLength(2);
    expect(result.addOns[0].name).toBe('Photography');
    expect(result.addOns[0].price).toBe(100);
    expect(result.addOns[0].id).toBeTruthy();
    expect(result.addOns[1].name).toBe('Videography');
    expect(result.addOns[1].price).toBe(150);
    expect(result.addOns[1].id).toBeTruthy();

    // IDs should be unique
    expect(result.addOns[0].id).not.toBe(result.addOns[1].id);
  });

  it('passes through new-format data unchanged', () => {
    const newFormat = {
      overview: 'Our services',
      offerings: [
        {
          id: 'existing-id-1',
          name: 'Consulting',
          description: 'Expert consulting',
          price: 300,
          priceLabel: 'per hour',
          addOnIds: ['addon-1'],
        },
      ],
      addOns: [
        {
          id: 'addon-1',
          name: 'Rush Delivery',
          price: 50,
          priceLabel: 'one-time',
        },
      ],
    };

    const result = normalizeProductService(newFormat);

    expect(result.overview).toBe('Our services');
    expect(result.offerings).toHaveLength(1);
    expect(result.offerings[0].id).toBe('existing-id-1');
    expect(result.offerings[0].name).toBe('Consulting');
    expect(result.offerings[0].price).toBe(300);
    expect(result.offerings[0].priceLabel).toBe('per hour');
    expect(result.offerings[0].addOnIds).toEqual(['addon-1']);
    expect(result.addOns).toHaveLength(1);
    expect(result.addOns[0].id).toBe('addon-1');
  });

  it('handles mixed data (has both packages and offerings) — offerings take precedence', () => {
    const mixed = {
      packages: [
        {
          name: 'Legacy Package',
          price: 100,
          includes: [],
          description: 'Old format',
        },
      ],
      offerings: [
        {
          id: 'new-1',
          name: 'New Offering',
          description: 'New format',
          price: 200,
          addOnIds: [],
        },
      ],
      addOns: [],
    };

    const result = normalizeProductService(mixed);

    // offerings takes precedence over packages
    expect(result.offerings).toHaveLength(1);
    expect(result.offerings[0].name).toBe('New Offering');
    expect(result.offerings[0].id).toBe('new-1');
  });

  it('generates ids for offerings missing them', () => {
    const data = {
      offerings: [
        {
          id: '',
          name: 'No ID Offering',
          description: 'Missing id',
          price: 100,
          addOnIds: [],
        },
        {
          name: 'Also No ID',
          description: 'Also missing',
          price: 200,
          addOnIds: [],
        },
      ],
      addOns: [
        {
          name: 'No ID Addon',
          price: 25,
        },
      ],
    };

    const result = normalizeProductService(data);

    expect(result.offerings[0].id).toBeTruthy();
    expect(result.offerings[1].id).toBeTruthy();
    expect(result.offerings[0].id).not.toBe('');
    expect(result.addOns[0].id).toBeTruthy();
  });
});
