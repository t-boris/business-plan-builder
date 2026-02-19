// Scenario Types for What-If Engine
// All interfaces are serializable (no methods) for Firestore compatibility.

export interface ScenarioMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  isBaseline: boolean;
}

// v2 types for Advanced Scenario Engine (Phase 18)

export interface ScenarioAssumption {
  id: string;
  label: string;
  value: string;
  category?: string;
}

export type ScenarioStatus = 'draft' | 'active' | 'archived';

// Dynamic scenario — v1 fields + optional v2 fields for backward compatibility
// variantRefs maps section slug to variant document ID
// sectionOverrides maps section slug to partial section data
export interface DynamicScenario {
  metadata: ScenarioMetadata;
  values: Record<string, number>; // only input variable values, keyed by variable ID

  // v2 fields (all optional — old scenarios omit these)
  assumptions?: ScenarioAssumption[];
  variantRefs?: Record<string, string>;       // sectionSlug -> variantId
  sectionOverrides?: Record<string, Record<string, unknown>>; // sectionSlug -> partial data
  status?: ScenarioStatus;
  horizonMonths?: number;
}

/**
 * Normalize raw Firestore data to the current DynamicScenario format.
 *
 * Handles three cases:
 * 1. null/undefined input - returns empty scenario with new UUID
 * 2. Old format (values-only, no v2 fields) - adds v2 defaults
 * 3. New format (has v2 fields) - passthrough with defaults for missing v2 fields
 */
export function normalizeScenario(data: unknown): DynamicScenario {
  if (!data || typeof data !== 'object') {
    return {
      metadata: {
        id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
        name: 'Untitled Scenario',
        description: '',
        createdAt: new Date().toISOString(),
        isBaseline: false,
      },
      values: {},
      assumptions: [],
      variantRefs: {},
      sectionOverrides: {},
      status: 'draft',
      horizonMonths: 12,
    };
  }

  const raw = data as Record<string, unknown>;

  // Ensure metadata exists
  const metadata = (raw.metadata && typeof raw.metadata === 'object'
    ? raw.metadata
    : {
        id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
        name: 'Untitled Scenario',
        description: '',
        createdAt: new Date().toISOString(),
        isBaseline: false,
      }) as ScenarioMetadata;

  // Ensure values exists
  const values = (raw.values && typeof raw.values === 'object'
    ? raw.values
    : {}) as Record<string, number>;

  // Apply v2 defaults for missing fields
  return {
    metadata,
    values,
    assumptions: Array.isArray(raw.assumptions) ? raw.assumptions as ScenarioAssumption[] : [],
    variantRefs: (raw.variantRefs && typeof raw.variantRefs === 'object'
      ? raw.variantRefs
      : {}) as Record<string, string>,
    sectionOverrides: (raw.sectionOverrides && typeof raw.sectionOverrides === 'object'
      ? raw.sectionOverrides
      : {}) as Record<string, Record<string, unknown>>,
    status: (['draft', 'active', 'archived'].includes(raw.status as string)
      ? raw.status
      : 'draft') as ScenarioStatus,
    horizonMonths: typeof raw.horizonMonths === 'number' ? raw.horizonMonths : 12,
  };
}
