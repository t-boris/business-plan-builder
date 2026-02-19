import type { ProductService, Offering, AddOn } from '@/types';

// Legacy types for backward-compatible normalization
// These match the old Package-based data format stored in Firestore

interface LegacyPackage {
  name: string;
  price: number;
  duration?: string;
  maxParticipants?: number;
  includes: string[];
  description: string;
}

interface LegacyAddOn {
  name: string;
  price: number;
}

interface LegacyProductService {
  packages?: LegacyPackage[];
  addOns?: LegacyAddOn[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Deterministic fallback ID for legacy/missing IDs.
 * Keeps IDs stable across renders so selects don't reset.
 */
function fallbackId(prefix: string, index: number, name?: string): string {
  const slug = name ? slugify(name) : '';
  return slug ? `${prefix}-${index + 1}-${slug}` : `${prefix}-${index + 1}`;
}

/**
 * Convert a legacy Package to a new Offering.
 * - `duration` becomes `priceLabel` (e.g. "2 hours")
 * - `includes` items are folded into description as bullet points
 */
function legacyPackageToOffering(pkg: LegacyPackage, index: number): Offering {
  let description = pkg.description ?? '';
  if (pkg.includes && pkg.includes.length > 0) {
    const bullets = pkg.includes.map((item) => `\u2022 ${item}`).join('\n');
    description = description ? `${description}\n${bullets}` : bullets;
  }

  return {
    id: fallbackId('off-legacy', index, pkg.name),
    name: pkg.name,
    description,
    price: pkg.price,
    priceLabel: pkg.duration || undefined,
    addOnIds: [],
  };
}

/** Convert a legacy AddOn to the new AddOn format (adds id). */
function legacyAddOnToNew(addon: LegacyAddOn, index: number): AddOn {
  return {
    id: fallbackId('addon-legacy', index, addon.name),
    name: addon.name,
    price: addon.price,
  };
}

/**
 * Normalize raw Firestore data to the current ProductService format.
 *
 * Handles three cases:
 * 1. New format (has `offerings` array) - pass through, ensure ids exist
 * 2. Legacy format (has `packages` array) - convert to offerings
 * 3. Empty/null input - return default empty ProductService
 *
 * When both `offerings` and `packages` exist, `offerings` takes precedence.
 */
export function normalizeProductService(raw: unknown): ProductService {
  if (!raw || typeof raw !== 'object') {
    return { overview: '', offerings: [], addOns: [] };
  }

  const data = raw as Record<string, unknown>;
  const overview = typeof data.overview === 'string' ? data.overview : '';

  // Case 1: New format — offerings array exists
  if (Array.isArray(data.offerings)) {
    const offerings = (data.offerings as Offering[]).map((o, index) => ({
      ...o,
      id:
        typeof o.id === 'string' && o.id.length > 0
          ? o.id
          : fallbackId('off', index, o.name),
    }));

    const addOns = Array.isArray(data.addOns)
      ? (data.addOns as AddOn[]).map((a, index) => ({
          ...a,
          id:
            typeof a.id === 'string' && a.id.length > 0
              ? a.id
              : fallbackId('addon', index, a.name),
        }))
      : [];

    return { overview, offerings, addOns };
  }

  // Case 2: Legacy format — packages array exists
  if (Array.isArray(data.packages)) {
    const legacy = data as unknown as LegacyProductService;
    const offerings = (legacy.packages ?? []).map((pkg, index) =>
      legacyPackageToOffering(pkg, index),
    );
    const addOns = (legacy.addOns ?? []).map((addon, index) =>
      legacyAddOnToNew(addon, index),
    );
    return { overview, offerings, addOns };
  }

  // Case 3: Neither exists — return default
  return { overview, offerings: [], addOns: [] };
}
