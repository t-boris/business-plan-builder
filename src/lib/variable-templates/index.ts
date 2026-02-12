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
