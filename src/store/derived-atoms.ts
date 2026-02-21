import { atom } from 'jotai';
import { scenarioValuesAtom } from './scenario-atoms.ts';
import { evaluateVariables } from '@/lib/formula-engine.ts';
import { businessVariablesAtom, sectionDerivedScopeAtom } from '@/store/business-atoms.ts';
import type { VariableDefinition } from '@/types';

// --- Dynamic Evaluation Atom (Phase 7) ---

// Evaluates all variables (input + computed) using the formula engine.
// Priority for input variable values:
//   1. Scenario override (user explicitly set a value for this scenario)
//   2. Section-derived value (computed from actual Operations/Financial/Marketing/KPI data)
//   3. Input variable's stored default value
// Section-derived scope is also passed as extraScope so formulas can reference
// section metrics even without a matching variable definition.
export const evaluatedValuesAtom = atom<Record<string, number>>((get) => {
  const definitions = get(businessVariablesAtom);
  if (!definitions) return {};
  const values = get(scenarioValuesAtom);
  const sectionScope = get(sectionDerivedScopeAtom);

  const merged: Record<string, VariableDefinition> = {};
  for (const [id, def] of Object.entries(definitions)) {
    if (def.type === 'input') {
      // Scenario value is an explicit override if user intentionally set it
      const scenarioValue = values[id];
      let effectiveValue = scenarioValue !== undefined
        ? scenarioValue
        : (sectionScope[id] ?? def.value);
      // Normalize percent values stored as whole numbers (e.g., 8 → 0.08)
      if (def.unit === 'percent' && effectiveValue > 1) {
        effectiveValue = effectiveValue / 100;
      }
      merged[id] = { ...def, value: effectiveValue };
    } else {
      merged[id] = def;
    }
  }

  try {
    return evaluateVariables(merged, sectionScope);
  } catch {
    // On error (e.g. circular dependency), return raw values as fallback
    const fallback: Record<string, number> = {};
    for (const [id, def] of Object.entries(merged)) {
      fallback[id] = def.value;
    }
    return fallback;
  }
});
