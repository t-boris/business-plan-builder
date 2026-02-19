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

/** Generate a unique ID, falling back for environments without crypto.randomUUID */
function generateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

/**
 * Convert a legacy Package to a new Offering.
 * - `duration` becomes `priceLabel` (e.g. "2 hours")
 * - `includes` items are folded into description as bullet points
 */
function legacyPackageToOffering(pkg: LegacyPackage): Offering {
  let description = pkg.description ?? '';
  if (pkg.includes && pkg.includes.length > 0) {
    const bullets = pkg.includes.map((item) => `\u2022 ${item}`).join('\n');
    description = description ? `${description}\n${bullets}` : bullets;
  }

  return {
    id: generateId(),
    name: pkg.name,
    description,
    price: pkg.price,
    priceLabel: pkg.duration || undefined,
    addOnIds: [],
  };
}

/** Convert a legacy AddOn to the new AddOn format (adds id). */
function legacyAddOnToNew(addon: LegacyAddOn): AddOn {
  return {
    id: generateId(),
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
    const offerings = (data.offerings as Offering[]).map((o) => ({
      ...o,
      id: o.id || generateId(),
    }));

    const addOns = Array.isArray(data.addOns)
      ? (data.addOns as AddOn[]).map((a) => ({
          ...a,
          id: a.id || generateId(),
        }))
      : [];

    return { overview, offerings, addOns };
  }

  // Case 2: Legacy format — packages array exists
  if (Array.isArray(data.packages)) {
    const legacy = data as unknown as LegacyProductService;
    const offerings = (legacy.packages ?? []).map(legacyPackageToOffering);
    const addOns = (legacy.addOns ?? []).map(legacyAddOnToNew);
    return { overview, offerings, addOns };
  }

  // Case 3: Neither exists — return default
  return { overview, offerings: [], addOns: [] };
}
