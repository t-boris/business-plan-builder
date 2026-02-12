import { useAtomValue, useSetAtom } from 'jotai';
import { activeBusinessIdAtom } from '@/store/business-atoms';
import {
  businessVariablesAtom,
  businessVariablesLoadedAtom,
} from '@/store/business-atoms';
import {
  getBusinessVariables,
  saveBusinessVariables,
} from '@/lib/business-firestore';
import type { VariableDefinition } from '@/types';

export function useBusinessVariables() {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const variables = useAtomValue(businessVariablesAtom);
  const isLoaded = useAtomValue(businessVariablesLoadedAtom);
  const setVariables = useSetAtom(businessVariablesAtom);
  const setLoaded = useSetAtom(businessVariablesLoadedAtom);

  // Load variables from Firestore
  async function loadVariables() {
    if (!businessId) return;
    try {
      const vars = await getBusinessVariables(businessId);
      setVariables(vars);
    } catch {
      // Silent fail — variables may not exist yet
    } finally {
      setLoaded(true);
    }
  }

  // Save all variables to Firestore (called after mutations)
  async function saveVariables(vars: Record<string, VariableDefinition>) {
    if (!businessId) return;
    setVariables(vars);
    saveBusinessVariables(businessId, vars).catch(console.error);
  }

  // Update a single variable's value (for input variables)
  function updateVariableValue(variableId: string, newValue: number) {
    if (!variables) return;
    const updated = {
      ...variables,
      [variableId]: { ...variables[variableId], value: newValue },
    };
    setVariables(updated);
    // Fire-and-forget save to Firestore
    if (businessId) {
      saveBusinessVariables(businessId, updated).catch(console.error);
    }
  }

  // Add a new variable
  function addVariable(variable: VariableDefinition) {
    if (!variables) return;
    const updated = {
      ...variables,
      [variable.id]: variable,
    };
    setVariables(updated);
    if (businessId) {
      saveBusinessVariables(businessId, updated).catch(console.error);
    }
  }

  // Remove a variable (and clean up references in other formulas' dependsOn)
  function removeVariable(variableId: string) {
    if (!variables) return;
    const { [variableId]: _removed, ...remaining } = variables;
    // Clean up dependsOn references in other variables
    const cleaned: Record<string, VariableDefinition> = {};
    for (const [id, def] of Object.entries(remaining)) {
      if (def.dependsOn?.includes(variableId)) {
        cleaned[id] = {
          ...def,
          dependsOn: def.dependsOn.filter((dep) => dep !== variableId),
        };
      } else {
        cleaned[id] = def;
      }
    }
    setVariables(cleaned);
    if (businessId) {
      saveBusinessVariables(businessId, cleaned).catch(console.error);
    }
  }

  // Update a variable's definition (label, formula, category, etc.)
  function updateVariableDefinition(
    variableId: string,
    updates: Partial<VariableDefinition>
  ) {
    if (!variables || !variables[variableId]) return;
    const updated = {
      ...variables,
      [variableId]: { ...variables[variableId], ...updates },
    };
    setVariables(updated);
    if (businessId) {
      saveBusinessVariables(businessId, updated).catch(console.error);
    }
  }

  return {
    variables,
    isLoaded,
    loadVariables,
    saveVariables,
    updateVariableValue,
    addVariable,
    removeVariable,
    updateVariableDefinition,
  };
}
