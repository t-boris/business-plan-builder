import type { VariableDefinition, VariableUnit } from "@/types/business";

// --- Variable Categories ---

export const VARIABLE_CATEGORIES = {
  revenue: { label: "Revenue", order: 1 },
  costs: { label: "Costs", order: 2 },
  unitEconomics: { label: "Unit Economics", order: 3 },
  growth: { label: "Growth", order: 4 },
  operations: { label: "Operations", order: 5 },
} as const;

export type VariableCategory = keyof typeof VARIABLE_CATEGORIES;

// --- Factory Functions ---

/**
 * Create an input variable definition.
 * Input variables hold user-provided values.
 */
export function inputVar(
  id: string,
  label: string,
  category: VariableCategory,
  unit: VariableUnit,
  defaultValue: number,
  description: string,
  opts?: { min?: number; max?: number; step?: number }
): VariableDefinition {
  return {
    id,
    label,
    type: "input",
    category,
    unit,
    value: defaultValue,
    defaultValue,
    description,
    ...opts,
  };
}

/**
 * Create a computed variable definition.
 * Computed variables derive their value from a formula referencing other variables.
 * Value starts at 0 and is computed at runtime by the formula engine.
 */
export function computedVar(
  id: string,
  label: string,
  category: VariableCategory,
  unit: VariableUnit,
  formula: string,
  dependsOn: string[],
  description: string
): VariableDefinition {
  return {
    id,
    label,
    type: "computed",
    category,
    unit,
    value: 0,
    defaultValue: 0,
    formula,
    dependsOn,
    description,
  };
}

// --- Conversion Helper ---

/**
 * Convert an array of VariableDefinition objects to a Record keyed by variable ID.
 * Used by template files to produce the format expected by BusinessTemplate.defaultVariables.
 */
export function toVariableRecord(
  variables: VariableDefinition[]
): Record<string, VariableDefinition> {
  return variables.reduce<Record<string, VariableDefinition>>((acc, v) => {
    acc[v.id] = v;
    return acc;
  }, {});
}
