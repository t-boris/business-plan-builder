import { atom } from 'jotai';
import { scenarioValuesAtom } from './scenario-atoms.ts';
import { evaluateVariables } from '@/lib/formula-engine.ts';
import { businessVariablesAtom } from '@/store/business-atoms.ts';
import type { VariableDefinition } from '@/types';

// --- Dynamic Evaluation Atom (Phase 7) ---

// Evaluates all variables (input + computed) using the formula engine
export const evaluatedValuesAtom = atom<Record<string, number>>((get) => {
  const definitions = get(businessVariablesAtom);
  if (!definitions) return {};
  const values = get(scenarioValuesAtom);

  // Create a merged copy where input variable values are overridden by scenario values
  const merged: Record<string, VariableDefinition> = {};
  for (const [id, def] of Object.entries(definitions)) {
    if (def.type === 'input') {
      merged[id] = { ...def, value: values[id] ?? def.value };
    } else {
      merged[id] = def;
    }
  }

  try {
    return evaluateVariables(merged);
  } catch {
    // On error (e.g. circular dependency), return raw values as fallback
    const fallback: Record<string, number> = {};
    for (const [id, def] of Object.entries(merged)) {
      fallback[id] = def.value;
    }
    return fallback;
  }
});
