// Business JSON Import/Export Utilities
// Exports complete business data as JSON bundle, imports JSON to overwrite business.

import {
  getBusiness,
  getSectionData,
  getBusinessVariables,
  listScenarioData,
  updateBusiness,
  saveSectionData,
  saveBusinessVariables,
  saveScenarioData,
} from './business-firestore';
import { SECTION_SLUGS } from './constants';
import type {
  BusinessProfile,
  VariableDefinition,
  DynamicScenario,
  SectionSlug,
} from '@/types';

// =============================================================================
// Types
// =============================================================================

export interface BusinessExportBundle {
  version: '1.0';
  exportedAt: string;
  profile: BusinessProfile;
  enabledSections: string[];
  sections: Record<string, unknown>;
  variables: Record<string, VariableDefinition> | null;
  scenarios: DynamicScenario[];
}

// =============================================================================
// Export
// =============================================================================

/**
 * Read all business data from Firestore and return as a typed bundle.
 */
export async function exportBusinessData(
  businessId: string
): Promise<BusinessExportBundle> {
  const [business, sectionResults, variables, scenarios] = await Promise.all([
    getBusiness(businessId),
    Promise.all(
      SECTION_SLUGS.map(async (slug) => {
        const data = await getSectionData(businessId, slug);
        return [slug, data] as [SectionSlug, unknown];
      })
    ),
    getBusinessVariables(businessId),
    listScenarioData(businessId),
  ]);

  if (!business) {
    throw new Error(`Business not found: ${businessId}`);
  }

  const sections: Record<string, unknown> = {};
  for (const [slug, data] of sectionResults) {
    if (data != null) {
      sections[slug] = data;
    }
  }

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profile: business.profile,
    enabledSections: business.enabledSections,
    sections,
    variables,
    scenarios,
  };
}

// =============================================================================
// Download Helper
// =============================================================================

/**
 * Trigger a browser file download from a JSON-serializable value.
 */
export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Type guard: checks that an unknown value looks like a valid BusinessExportBundle.
 */
export function validateExportBundle(
  data: unknown
): data is BusinessExportBundle {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.version !== 'string') return false;
  if (!obj.profile || typeof obj.profile !== 'object') return false;
  const profile = obj.profile as Record<string, unknown>;
  if (typeof profile.name !== 'string' || typeof profile.type !== 'string') return false;
  if (!obj.sections || typeof obj.sections !== 'object') return false;
  return true;
}

// =============================================================================
// Import
// =============================================================================

/**
 * Overwrite the current business data with the contents of a bundle.
 * Profile, enabledSections, and all sections are overwritten.
 * Variables are overwritten if present.
 * Scenarios are written additively (existing scenarios not in the bundle are kept).
 */
export async function importBusinessData(
  businessId: string,
  bundle: BusinessExportBundle
): Promise<void> {
  // 1. Update profile + enabledSections
  await updateBusiness(businessId, {
    profile: bundle.profile,
    enabledSections: bundle.enabledSections,
  });

  // 2. Write all sections
  const sectionEntries = Object.entries(bundle.sections);
  await Promise.all(
    sectionEntries.map(([slug, data]) =>
      saveSectionData(businessId, slug, data as object)
    )
  );

  // 3. Write variables if present
  if (bundle.variables) {
    await saveBusinessVariables(businessId, bundle.variables);
  }

  // 4. Write scenarios (additive — does not delete existing scenarios)
  if (bundle.scenarios?.length) {
    await Promise.all(
      bundle.scenarios.map((scenario) =>
        saveScenarioData(businessId, scenario)
      )
    );
  }
}

// =============================================================================
// JSON Schema Export
// =============================================================================

/**
 * Generate a JSON Schema (draft-07) describing the BusinessExportBundle format.
 * Hand-crafted since TypeScript types are not available at runtime.
 */
export function generateExportSchema(): object {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'BusinessExportBundle',
    description:
      'Complete business plan export format. Contains profile, all sections, variables, and scenarios.',
    type: 'object',
    required: ['version', 'exportedAt', 'profile', 'enabledSections', 'sections'],
    properties: {
      version: { type: 'string', const: '1.0' },
      exportedAt: { type: 'string', format: 'date-time' },
      profile: {
        type: 'object',
        required: ['name', 'type', 'industry', 'location', 'description', 'currency'],
        properties: {
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['saas', 'service', 'retail', 'restaurant', 'event', 'manufacturing', 'custom'],
          },
          industry: { type: 'string' },
          location: { type: 'string' },
          description: { type: 'string' },
          currency: { type: 'string' },
        },
      },
      enabledSections: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'executive-summary', 'market-analysis', 'product-service',
            'marketing-strategy', 'operations', 'financial-projections',
            'growth-timeline', 'risks-due-diligence', 'kpis-metrics', 'launch-plan',
          ],
        },
      },
      sections: {
        type: 'object',
        description: 'Raw section data keyed by section slug.',
        properties: {
          'executive-summary': {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              mission: { type: 'string' },
              vision: { type: 'string' },
              keyHighlights: { type: 'array', items: { type: 'string' } },
            },
          },
          'market-analysis': {
            type: 'object',
            properties: {
              enabledBlocks: { type: 'object' },
              marketSizing: { type: 'object' },
              marketNarrative: { type: 'string' },
              competitors: { type: 'array' },
              demographics: { type: 'object' },
              acquisitionFunnel: { type: 'array' },
              adoptionModel: { type: 'object' },
              customMetrics: { type: 'array' },
            },
          },
          'product-service': {
            type: 'object',
            properties: {
              overview: { type: 'string' },
              offerings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: ['number', 'null'] },
                    priceLabel: { type: 'string' },
                    addOnIds: { type: 'array', items: { type: 'string' } },
                    image: {
                      type: 'object',
                      properties: {
                        url: { type: 'string' },
                        storagePath: { type: 'string' },
                        alt: { type: 'string' },
                      },
                    },
                  },
                },
              },
              addOns: { type: 'array' },
            },
          },
          'marketing-strategy': {
            type: 'object',
            properties: {
              channels: { type: 'array' },
              offers: { type: 'array', items: { type: 'string' } },
              landingPage: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
          operations: {
            type: 'object',
            properties: {
              workforce: { type: 'array' },
              capacityItems: { type: 'array' },
              variableComponents: { type: 'array' },
              costItems: { type: 'array' },
              equipment: { type: 'array', items: { type: 'string' } },
              safetyProtocols: { type: 'array', items: { type: 'string' } },
              operationalMetrics: { type: 'array' },
            },
          },
          'financial-projections': {
            type: 'object',
            properties: {
              startingCash: { type: 'number' },
              months: { type: 'array' },
              unitEconomics: {
                type: 'object',
                properties: {
                  pricePerUnit: { type: 'number' },
                  variableCostPerUnit: { type: 'number' },
                  profitPerUnit: { type: 'number' },
                  breakEvenUnits: { type: 'number' },
                },
              },
              seasonCoefficients: {
                type: 'array',
                items: { type: 'number' },
                minItems: 12,
                maxItems: 12,
              },
            },
          },
          'growth-timeline': {
            type: 'object',
            properties: {
              events: { type: 'array' },
              autoSync: { type: 'boolean' },
            },
          },
          'risks-due-diligence': {
            type: 'object',
            properties: {
              risks: { type: 'array' },
              complianceChecklist: { type: 'array' },
              investmentVerdict: { type: 'object' },
              dueDiligenceChecklist: { type: 'array' },
            },
          },
          'kpis-metrics': {
            type: 'object',
            properties: {
              targets: {
                type: 'object',
                properties: {
                  monthlyLeads: { type: 'number' },
                  conversionRate: { type: 'number' },
                  pricePerUnit: { type: 'number' },
                  cacPerLead: { type: 'number' },
                  cacPerBooking: { type: 'number' },
                  monthlyBookings: { type: 'number' },
                },
              },
              actuals: { type: 'object' },
            },
          },
          'launch-plan': {
            type: 'object',
            properties: {
              stages: { type: 'array' },
            },
          },
        },
      },
      variables: {
        type: ['object', 'null'],
        description: 'Variable definitions keyed by variable ID.',
        additionalProperties: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string', enum: ['input', 'computed'] },
            category: { type: 'string' },
            unit: { type: 'string', enum: ['currency', 'percent', 'count', 'months', 'days', 'hours', 'ratio'] },
            value: { type: 'number' },
            defaultValue: { type: 'number' },
            formula: { type: 'string' },
            dependsOn: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
            min: { type: 'number' },
            max: { type: 'number' },
            step: { type: 'number' },
          },
        },
      },
      scenarios: {
        type: 'array',
        items: {
          type: 'object',
          required: ['metadata', 'values'],
          properties: {
            metadata: {
              type: 'object',
              required: ['id', 'name', 'description', 'createdAt', 'isBaseline'],
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                isBaseline: { type: 'boolean' },
              },
            },
            values: {
              type: 'object',
              additionalProperties: { type: 'number' },
            },
            assumptions: { type: 'array' },
            variantRefs: { type: 'object' },
            sectionOverrides: { type: 'object' },
            status: { type: 'string', enum: ['draft', 'active', 'archived'] },
            horizonMonths: { type: 'number' },
          },
        },
      },
    },
  };
}
