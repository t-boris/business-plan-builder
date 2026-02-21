import type { BusinessType } from "@/types";
import type { VariableDefinition } from "@/types/business";

export { SAAS_VARIABLES } from "./saas";
export { SERVICE_VARIABLES } from "./service";
export { RETAIL_VARIABLES } from "./retail";
export { RESTAURANT_VARIABLES } from "./restaurant";
export { EVENT_VARIABLES } from "./event";
export { MANUFACTURING_VARIABLES } from "./manufacturing";
export { CUSTOM_VARIABLES } from "./custom";

import { SAAS_VARIABLES } from "./saas";
import { SERVICE_VARIABLES } from "./service";
import { RETAIL_VARIABLES } from "./retail";
import { RESTAURANT_VARIABLES } from "./restaurant";
import { EVENT_VARIABLES } from "./event";
import { MANUFACTURING_VARIABLES } from "./manufacturing";
import { CUSTOM_VARIABLES } from "./custom";

export const VARIABLE_TEMPLATES: Record<BusinessType, VariableDefinition[]> = {
  saas: SAAS_VARIABLES,
  service: SERVICE_VARIABLES,
  retail: RETAIL_VARIABLES,
  restaurant: RESTAURANT_VARIABLES,
  event: EVENT_VARIABLES,
  manufacturing: MANUFACTURING_VARIABLES,
  custom: CUSTOM_VARIABLES,
};

/**
 * Get default variables for a business type as a Record keyed by variable ID.
 * Converts the template array into a lookup map for efficient access.
 */
export function getDefaultVariables(
  type: BusinessType
): Record<string, VariableDefinition> {
  const variables = VARIABLE_TEMPLATES[type] ?? CUSTOM_VARIABLES;
  return variables.reduce<Record<string, VariableDefinition>>((acc, v) => {
    acc[v.id] = v;
    return acc;
  }, {});
}

/**
 * Mapping from scope keys to variable IDs, per business type.
 * Used to seed realistic variable defaults from actual section data.
 */
const SCOPE_TO_VARIABLE_MAP: Partial<Record<BusinessType, Record<string, string>>> = {
  manufacturing: {
    pricePerUnit: "sellingPricePerUnit",
    totalPlannedOutputPerMonth: "monthlyProductionCapacity",
    fixedMonthlyTotal: "monthlyFixedCosts",
    variableCostPerOutput: "rawMaterialCostPerUnit",
  },
  saas: {
    pricePerUnit: "monthlyPrice",
    monthlyBookings: "numberOfCustomers",
    fixedMonthlyTotal: "monthlyFixedCosts",
  },
  service: {
    monthlyMarketingBudget: "monthlyMarketingBudget",
    fixedMonthlyTotal: "monthlyOverhead",
  },
  retail: {
    monthlyLeads: "monthlyFootTraffic",
    conversionRate: "conversionRate",
    pricePerUnit: "averageTransactionValue",
    fixedMonthlyTotal: "monthlyRent",
  },
  event: {
    monthlyMarketingBudget: "monthlyMarketingBudget",
    fixedMonthlyTotal: "monthlyFixedCosts",
  },
};

/**
 * Override input variable values using real section-derived scope data.
 * For each mapping entry: if scope has a non-zero value for the scope key
 * AND the corresponding variable exists as an input type, set variable.value
 * to the scope value. Mutates `vars` in place.
 */
export function seedVariablesFromScope(
  vars: Record<string, VariableDefinition>,
  scope: Record<string, number>,
  type: BusinessType,
): void {
  const mapping = SCOPE_TO_VARIABLE_MAP[type];
  if (!mapping) return;

  for (const [scopeKey, variableId] of Object.entries(mapping)) {
    const scopeValue = scope[scopeKey];
    if (scopeValue && scopeValue !== 0) {
      const variable = vars[variableId];
      if (variable && variable.type === "input") {
        variable.value = scopeValue;
      }
    }
  }
}
