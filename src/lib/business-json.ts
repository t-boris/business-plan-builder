// Business JSON Import/Export Utilities
// Exports complete business data as JSON bundle, imports JSON to overwrite business.

import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  getBusiness,
  getSectionData,
  getBusinessVariables,
  listScenarioData,
  saveBusinessVariables,
  saveScenarioData,
  updateBusiness,
} from './business-firestore';
import { SECTION_SLUGS } from './constants';
import { VARIABLE_TEMPLATES } from './variable-templates';
import type {
  BusinessProfile,
  BusinessType,
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
 * Full replace — old section data is wiped, not merged.
 * Sections not in the bundle are deleted from Firestore.
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

  // 2. Full-replace sections: overwrite included, delete missing
  const importedSlugs = new Set(Object.keys(bundle.sections));
  const sectionWrites = Object.entries(bundle.sections).map(([slug, data]) =>
    setDoc(
      doc(db, 'businesses', businessId, 'sections', slug),
      { ...(data as object), updatedAt: new Date().toISOString() }
    )
  );
  const sectionDeletes = SECTION_SLUGS
    .filter((slug) => !importedSlugs.has(slug))
    .map((slug) =>
      deleteDoc(doc(db, 'businesses', businessId, 'sections', slug))
    );
  await Promise.all([...sectionWrites, ...sectionDeletes]);

  // 3. Full-replace variables: keep only input assumptions, strip computed
  const variablesRef = doc(db, 'businesses', businessId, 'state', 'variables');
  if (bundle.variables) {
    const filtered = filterToInputVariables(bundle.variables);
    if (Object.keys(filtered).length > 0) {
      await setDoc(variablesRef, { definitions: filtered });
    } else {
      await deleteDoc(variablesRef);
    }
  } else {
    await deleteDoc(variablesRef);
  }

  // 4. Full-replace scenarios: delete existing, then write imported
  //    Clean scenario values to only reference kept variable IDs
  const keptVariableIds = bundle.variables
    ? new Set(Object.keys(filterToInputVariables(bundle.variables)))
    : new Set<string>();

  const existingScenarios = await listScenarioData(businessId);
  if (existingScenarios.length > 0) {
    await Promise.all(
      existingScenarios.map((s) =>
        deleteDoc(doc(db, 'businesses', businessId, 'scenarios', s.metadata.id))
      )
    );
  }
  if (bundle.scenarios?.length) {
    await Promise.all(
      bundle.scenarios.map((scenario) => {
        const cleanedScenario = {
          ...scenario,
          values: cleanScenarioValues(scenario.values, keptVariableIds),
        };
        const data = { ...cleanedScenario } as Record<string, unknown>;
        return setDoc(
          doc(db, 'businesses', businessId, 'scenarios', scenario.metadata.id),
          data
        );
      })
    );
  }
}

// =============================================================================
// Variable Cleaning Helpers
// =============================================================================

/**
 * Keep only input (assumption) variables, strip all computed variables.
 * Computed values come from section calculations, not the variable library.
 */
function filterToInputVariables(
  variables: Record<string, VariableDefinition>
): Record<string, VariableDefinition> {
  const result: Record<string, VariableDefinition> = {};
  for (const [id, v] of Object.entries(variables)) {
    if (v.type === 'input') {
      result[id] = v;
    }
  }
  return result;
}

/**
 * Remove scenario value entries that reference variable IDs not in the kept set.
 */
function cleanScenarioValues(
  values: Record<string, number>,
  keptIds: Set<string>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(values)) {
    if (keptIds.has(key)) {
      result[key] = val;
    }
  }
  return result;
}

// =============================================================================
// Clean Plan (remove orphaned/computed/template variables from existing business)
// =============================================================================

/**
 * Build set of all template variable IDs across all business types.
 * These are generic boilerplate variables, not business-specific assumptions.
 */
function getTemplateVariableIds(): Set<string> {
  const ids = new Set<string>();
  for (const variables of Object.values(VARIABLE_TEMPLATES)) {
    for (const v of variables) {
      ids.add(v.id);
    }
  }
  return ids;
}

/**
 * Detect duplicate variables (same label appearing multiple times).
 * Returns IDs of duplicates to remove (keeps first occurrence).
 */
function getDuplicateIds(variables: Record<string, VariableDefinition>): Set<string> {
  const seenLabels = new Map<string, string>(); // label -> first ID
  const dupes = new Set<string>();
  for (const v of Object.values(variables)) {
    const normalized = v.label.toLowerCase().trim();
    if (seenLabels.has(normalized)) {
      dupes.add(v.id);
    } else {
      seenLabels.set(normalized, v.id);
    }
  }
  return dupes;
}

/**
 * Clean a business plan's variable library:
 * - Remove all computed variables (keep only input assumptions)
 * - Remove default template variables (generic boilerplate)
 * - Remove duplicate variables (same label)
 * - Clean scenario values to match remaining variable IDs
 *
 * Returns stats about what was removed.
 */
export async function cleanBusinessPlan(
  businessId: string
): Promise<{ removedVariables: number; cleanedScenarios: number }> {
  const [business, variables, scenarios] = await Promise.all([
    getBusiness(businessId),
    getBusinessVariables(businessId),
    listScenarioData(businessId),
  ]);

  let removedVariables = 0;
  let cleanedScenarios = 0;

  if (variables) {
    const originalCount = Object.keys(variables).length;
    const templateIds = getTemplateVariableIds();
    const duplicateIds = getDuplicateIds(variables);

    // Keep only: input variables that are NOT from templates and NOT duplicates
    const filtered: Record<string, VariableDefinition> = {};
    for (const [id, v] of Object.entries(variables)) {
      if (v.type !== 'input') continue;       // remove computed
      if (templateIds.has(id)) continue;       // remove template defaults
      if (duplicateIds.has(id)) continue;      // remove duplicates
      filtered[id] = v;
    }

    removedVariables = originalCount - Object.keys(filtered).length;

    if (removedVariables > 0) {
      if (Object.keys(filtered).length > 0) {
        await saveBusinessVariables(businessId, filtered);
      } else {
        // All variables removed — delete the document
        await saveBusinessVariables(businessId, {});
      }
    }

    // Clean scenario values
    const keptIds = new Set(Object.keys(filtered));
    for (const scenario of scenarios) {
      const originalKeys = Object.keys(scenario.values).length;
      const cleanedValues = cleanScenarioValues(scenario.values, keptIds);
      const cleanedKeys = Object.keys(cleanedValues).length;

      if (originalKeys !== cleanedKeys) {
        cleanedScenarios++;
        await saveScenarioData(businessId, {
          ...scenario,
          values: cleanedValues,
        });
      }
    }
  }

  return { removedVariables, cleanedScenarios };
}

// =============================================================================
// JSON Schema Export
// =============================================================================

/**
 * Generate a JSON Schema (draft-07) describing the BusinessExportBundle format.
 * Fully detailed — every array item and nested object is described with required fields.
 */
export function generateExportSchema(): object {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'BusinessExportBundle',
    description: 'Complete business plan export format for import into the app. All array items must follow the exact shapes described here.',
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
          type: { type: 'string', enum: ['saas', 'service', 'retail', 'restaurant', 'event', 'manufacturing', 'custom'] },
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
          enum: ['executive-summary', 'market-analysis', 'product-service', 'marketing-strategy', 'operations', 'financial-projections', 'growth-timeline', 'risks-due-diligence', 'kpis-metrics', 'launch-plan'],
        },
      },
      sections: {
        type: 'object',
        description: 'Section data keyed by section slug. Each section must match the exact shape described below.',
        properties: {
          'executive-summary': {
            type: 'object',
            required: ['summary', 'mission', 'vision', 'keyHighlights'],
            properties: {
              summary: { type: 'string' },
              mission: { type: 'string' },
              vision: { type: 'string' },
              keyHighlights: { type: 'array', items: { type: 'string' } },
            },
          },
          'market-analysis': {
            type: 'object',
            required: ['enabledBlocks', 'marketSizing', 'marketNarrative', 'competitors', 'demographics', 'acquisitionFunnel', 'adoptionModel', 'customMetrics'],
            properties: {
              enabledBlocks: {
                type: 'object',
                description: 'Toggle blocks on/off. Keys must be exactly: sizing, competitors, demographics, acquisitionFunnel, adoptionModel, customMetrics',
                properties: {
                  sizing: { type: 'boolean' },
                  competitors: { type: 'boolean' },
                  demographics: { type: 'boolean' },
                  acquisitionFunnel: { type: 'boolean' },
                  adoptionModel: { type: 'boolean' },
                  customMetrics: { type: 'boolean' },
                },
              },
              marketSizing: {
                type: 'object',
                properties: {
                  tam: {
                    type: 'object',
                    required: ['approach', 'steps'],
                    properties: {
                      approach: { type: 'string', enum: ['top-down', 'bottom-up', 'custom'] },
                      steps: { type: 'array', items: {
                        type: 'object',
                        required: ['label', 'value', 'type'],
                        properties: {
                          label: { type: 'string' },
                          value: { type: 'number' },
                          type: { type: 'string', enum: ['currency', 'percentage', 'count'] },
                        },
                      }},
                    },
                  },
                  sam: { type: 'object', required: ['steps'], properties: {
                    steps: { type: 'array', items: {
                      type: 'object', required: ['label', 'value', 'type'],
                      properties: { label: { type: 'string' }, value: { type: 'number' }, type: { type: 'string', enum: ['currency', 'percentage', 'count'] } },
                    }},
                  }},
                  som: { type: 'object', required: ['steps'], properties: {
                    steps: { type: 'array', items: {
                      type: 'object', required: ['label', 'value', 'type'],
                      properties: { label: { type: 'string' }, value: { type: 'number' }, type: { type: 'string', enum: ['currency', 'percentage', 'count'] } },
                    }},
                  }},
                },
              },
              marketNarrative: { type: 'string' },
              competitors: { type: 'array', items: {
                type: 'object', required: ['name', 'pricing', 'strengths', 'weaknesses'],
                properties: {
                  name: { type: 'string' },
                  pricing: { type: 'string' },
                  strengths: { type: 'string' },
                  weaknesses: { type: 'string' },
                },
              }},
              demographics: {
                type: 'object', required: ['population', 'income', 'metrics'],
                properties: {
                  population: { type: 'number' },
                  income: { type: 'string' },
                  metrics: { type: 'array', items: {
                    type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, source: { type: 'string' } },
                  }},
                },
              },
              acquisitionFunnel: { type: 'array', items: {
                type: 'object', required: ['label', 'description', 'volume', 'conversionRate'],
                properties: {
                  label: { type: 'string', description: 'Stage name, e.g. "Awareness", "Interest", "Purchase"' },
                  description: { type: 'string' },
                  volume: { type: 'number' },
                  conversionRate: { type: 'number', description: '0-100 percent conversion to next stage' },
                },
              }},
              adoptionModel: {
                type: 'object', required: ['type', 'totalMarket', 'initialUsers', 'growthRate', 'projectionMonths'],
                properties: {
                  type: { type: 'string', enum: ['linear', 's-curve'] },
                  totalMarket: { type: 'number' },
                  initialUsers: { type: 'number' },
                  growthRate: { type: 'number', description: 'Decimal, e.g. 0.3 for 30%' },
                  projectionMonths: { type: 'number' },
                },
              },
              customMetrics: { type: 'array', items: {
                type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, source: { type: 'string' } },
              }},
            },
          },
          'product-service': {
            type: 'object', required: ['offerings', 'addOns'],
            properties: {
              overview: { type: 'string' },
              offerings: { type: 'array', items: {
                type: 'object', required: ['id', 'name', 'description', 'price', 'addOnIds'],
                properties: {
                  id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' },
                  price: { type: ['number', 'null'] }, priceLabel: { type: 'string' },
                  addOnIds: { type: 'array', items: { type: 'string' } },
                  image: { type: 'object', properties: { url: { type: 'string' }, storagePath: { type: 'string' }, alt: { type: 'string' } } },
                },
              }},
              addOns: { type: 'array', items: {
                type: 'object', required: ['id', 'name', 'price'],
                properties: { id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' }, priceLabel: { type: 'string' } },
              }},
            },
          },
          'marketing-strategy': {
            type: 'object', required: ['channels', 'offers', 'landingPage'],
            properties: {
              channels: { type: 'array', items: {
                type: 'object', required: ['name', 'budget', 'expectedLeads', 'expectedCAC', 'description', 'tactics'],
                properties: {
                  name: { type: 'string' }, budget: { type: 'number' },
                  expectedLeads: { type: 'number' }, expectedCAC: { type: 'number' },
                  description: { type: 'string' },
                  tactics: { type: 'array', items: { type: 'string' } },
                  url: { type: 'string' },
                },
              }},
              offers: { type: 'array', items: { type: 'string' } },
              landingPage: { type: 'object', required: ['url', 'description'],
                properties: { url: { type: 'string' }, description: { type: 'string' } },
              },
            },
          },
          operations: {
            type: 'object', required: ['workforce', 'capacityItems', 'variableComponents', 'costItems', 'equipment', 'safetyProtocols', 'operationalMetrics'],
            properties: {
              workforce: { type: 'array', items: {
                type: 'object', required: ['role', 'count', 'ratePerHour', 'hoursPerWeek'],
                properties: { role: { type: 'string' }, count: { type: 'number' }, ratePerHour: { type: 'number' }, hoursPerWeek: { type: 'number' } },
              }},
              capacityItems: { type: 'array', items: {
                type: 'object', required: ['id', 'name', 'outputUnitLabel', 'plannedOutputPerMonth', 'maxOutputPerDay', 'maxOutputPerWeek', 'maxOutputPerMonth', 'utilizationRate'],
                properties: {
                  id: { type: 'string' }, name: { type: 'string' }, offeringId: { type: 'string' },
                  outputUnitLabel: { type: 'string' }, plannedOutputPerMonth: { type: 'number' },
                  maxOutputPerDay: { type: 'number' }, maxOutputPerWeek: { type: 'number' },
                  maxOutputPerMonth: { type: 'number' }, utilizationRate: { type: 'number', description: '0-100' },
                },
              }},
              variableComponents: { type: 'array', items: {
                type: 'object', required: ['id', 'name', 'sourcingModel', 'componentUnitLabel', 'costPerComponentUnit', 'componentUnitsPerOutput', 'orderQuantity', 'orderFee'],
                properties: {
                  id: { type: 'string' }, name: { type: 'string' }, offeringId: { type: 'string' },
                  description: { type: 'string' }, supplier: { type: 'string' },
                  sourcingModel: { type: 'string', enum: ['in-house', 'purchase-order', 'on-demand'] },
                  componentUnitLabel: { type: 'string' }, costPerComponentUnit: { type: 'number' },
                  componentUnitsPerOutput: { type: 'number' }, orderQuantity: { type: 'number' }, orderFee: { type: 'number' },
                },
              }},
              costItems: { type: 'array', items: {
                type: 'object', required: ['category', 'type', 'rate', 'driverType', 'driverQuantityPerMonth'],
                properties: {
                  category: { type: 'string' }, type: { type: 'string', enum: ['variable', 'fixed'] },
                  rate: { type: 'number' },
                  driverType: { type: 'string', enum: ['per-unit', 'per-order', 'per-service-hour', 'per-machine-hour', 'monthly', 'quarterly', 'yearly'] },
                  driverQuantityPerMonth: { type: 'number' },
                },
              }},
              equipment: { type: 'array', items: { type: 'string' } },
              safetyProtocols: { type: 'array', items: { type: 'string' } },
              operationalMetrics: { type: 'array', items: {
                type: 'object', required: ['name', 'unit', 'value', 'target'],
                properties: { name: { type: 'string' }, unit: { type: 'string' }, value: { type: 'number' }, target: { type: 'number' } },
              }},
            },
          },
          'financial-projections': {
            type: 'object', required: ['startingCash', 'months', 'unitEconomics', 'seasonCoefficients'],
            properties: {
              startingCash: { type: 'number' },
              months: { type: 'array', items: {
                type: 'object', required: ['month', 'revenue', 'costs', 'profit'],
                properties: {
                  month: { type: 'string', description: 'Month label, e.g. "Month 1" or "Jan 2026"' },
                  revenue: { type: 'number' },
                  costs: {
                    type: 'object', required: ['marketing', 'labor', 'supplies', 'museum', 'transport', 'fixed'],
                    description: 'Cost breakdown by category. Use 0 for unused categories.',
                    properties: {
                      marketing: { type: 'number' }, labor: { type: 'number' },
                      supplies: { type: 'number' }, museum: { type: 'number', description: 'Legacy category, use 0' },
                      transport: { type: 'number', description: 'Legacy category, use 0' }, fixed: { type: 'number' },
                    },
                  },
                  profit: { type: 'number' },
                  nonOperatingCashFlow: { type: 'number', description: 'Optional: financing/investing cash flow not in revenue' },
                },
              }},
              unitEconomics: {
                type: 'object', required: ['pricePerUnit', 'variableCostPerUnit', 'profitPerUnit', 'breakEvenUnits'],
                properties: {
                  pricePerUnit: { type: 'number' }, variableCostPerUnit: { type: 'number' },
                  profitPerUnit: { type: 'number' }, breakEvenUnits: { type: 'number' },
                },
              },
              seasonCoefficients: {
                type: 'array', items: { type: 'number' }, minItems: 12, maxItems: 12,
                description: '12 multipliers (one per calendar month), 1.0 = average. E.g. [0.8, 0.8, 0.9, 1.0, 1.0, 1.1, 1.1, 1.1, 1.0, 1.0, 1.2, 1.3]',
              },
            },
          },
          'growth-timeline': {
            type: 'object', required: ['events', 'autoSync'],
            properties: {
              events: { type: 'array', items: {
                type: 'object', required: ['id', 'month', 'label', 'delta', 'enabled'],
                properties: {
                  id: { type: 'string' }, month: { type: 'number', description: '1-based month when event takes effect' },
                  label: { type: 'string' }, enabled: { type: 'boolean' },
                  durationMonths: { type: 'number' },
                  delta: {
                    type: 'object', required: ['type', 'data'],
                    description: 'Event type and type-specific data. Types: hire, cost-change, capacity-change, marketing-change, custom, funding-round, facility-build, hiring-campaign, price-change, equipment-purchase, seasonal-campaign',
                    properties: {
                      type: { type: 'string', enum: ['hire', 'cost-change', 'capacity-change', 'marketing-change', 'custom', 'funding-round', 'facility-build', 'hiring-campaign', 'price-change', 'equipment-purchase', 'seasonal-campaign'] },
                      data: { type: 'object', description: 'Shape depends on delta.type. For hire: { role, count, ratePerHour, hoursPerWeek }. For cost-change: { category, costType, rate, driverType, driverQuantityPerMonth }. For capacity-change: { outputDelta, capacityItemId? }. For marketing-change: { monthlyBudget }. For custom: { label, value, target }. For funding-round: { amount, legalCosts, investmentType }. For facility-build: { constructionCost, monthlyRent, capacityAdded, capacityItemId? }. For hiring-campaign: { totalHires, role, ratePerHour, hoursPerWeek, recruitingCostPerHire }. For price-change: { newPricePerUnit }. For equipment-purchase: { purchaseCost, capacityIncrease, maintenanceCostMonthly, capacityItemId? }. For seasonal-campaign: { budgetIncrease }.' },
                    },
                  },
                },
              }},
              autoSync: { type: 'boolean', description: 'When true, computed projections overwrite Financial Projections' },
            },
          },
          'risks-due-diligence': {
            type: 'object', required: ['risks', 'complianceChecklist'],
            properties: {
              risks: { type: 'array', items: {
                type: 'object', required: ['category', 'title', 'description', 'severity', 'mitigation'],
                properties: {
                  category: { type: 'string', enum: ['regulatory', 'operational', 'financial', 'legal', 'safety', 'dependency', 'capacity', 'market'] },
                  title: { type: 'string' }, description: { type: 'string' },
                  severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  mitigation: { type: 'string' },
                },
              }},
              complianceChecklist: { type: 'array', items: {
                type: 'object', required: ['item', 'status'],
                properties: { item: { type: 'string' }, status: { type: 'string', enum: ['complete', 'pending', 'not-started'] } },
              }},
              investmentVerdict: {
                type: 'object', properties: {
                  verdict: { type: 'string', enum: ['strong-go', 'conditional-go', 'proceed-with-caution', 'defer', 'no-go'] },
                  conditions: { type: 'array', items: { type: 'string' } },
                },
              },
              dueDiligenceChecklist: { type: 'array', items: {
                type: 'object', required: ['item', 'detail', 'priority', 'status'],
                properties: {
                  item: { type: 'string' }, detail: { type: 'string' },
                  priority: { type: 'string', enum: ['required', 'advised'] },
                  status: { type: 'string', enum: ['complete', 'pending', 'not-started'] },
                },
              }},
            },
          },
          'kpis-metrics': {
            type: 'object', required: ['targets'],
            properties: {
              targets: {
                type: 'object', required: ['monthlyLeads', 'conversionRate', 'pricePerUnit', 'cacPerLead', 'cacPerBooking', 'monthlyBookings'],
                properties: {
                  monthlyLeads: { type: 'number' }, conversionRate: { type: 'number' },
                  pricePerUnit: { type: 'number' }, cacPerLead: { type: 'number' },
                  cacPerBooking: { type: 'number' }, monthlyBookings: { type: 'number' },
                },
              },
              actuals: { type: 'object', description: 'Same shape as targets, optional' },
            },
          },
          'launch-plan': {
            type: 'object', required: ['stages'],
            properties: {
              stages: { type: 'array', items: {
                type: 'object', required: ['name', 'startDate', 'endDate', 'tasks'],
                properties: {
                  name: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' },
                  tasks: { type: 'array', items: {
                    type: 'object', required: ['task', 'status'],
                    properties: { task: { type: 'string' }, status: { type: 'string', enum: ['done', 'in-progress', 'pending'] } },
                  }},
                },
              }},
            },
          },
        },
      },
      variables: {
        type: ['object', 'null'],
        description: 'Variable definitions keyed by variable ID.',
        additionalProperties: {
          type: 'object',
          required: ['id', 'label', 'type', 'category', 'unit', 'value', 'defaultValue'],
          properties: {
            id: { type: 'string' }, label: { type: 'string' },
            type: { type: 'string', enum: ['input', 'computed'] },
            category: { type: 'string' },
            unit: { type: 'string', enum: ['currency', 'percent', 'count', 'months', 'days', 'hours', 'ratio'] },
            value: { type: 'number' }, defaultValue: { type: 'number' },
            formula: { type: 'string' }, dependsOn: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' }, min: { type: 'number' }, max: { type: 'number' }, step: { type: 'number' },
          },
        },
      },
      scenarios: {
        type: 'array',
        items: {
          type: 'object', required: ['metadata', 'values'],
          properties: {
            metadata: {
              type: 'object', required: ['id', 'name', 'description', 'createdAt', 'isBaseline'],
              properties: {
                id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' }, isBaseline: { type: 'boolean' },
              },
            },
            values: { type: 'object', additionalProperties: { type: 'number' } },
            assumptions: { type: 'array', items: {
              type: 'object', required: ['id', 'label', 'value'],
              properties: { id: { type: 'string' }, label: { type: 'string' }, value: { type: 'string' }, category: { type: 'string' } },
            }},
            variantRefs: { type: 'object' }, sectionOverrides: { type: 'object' },
            status: { type: 'string', enum: ['draft', 'active', 'archived'] },
            horizonMonths: { type: 'number' },
          },
        },
      },
    },
  };
}
