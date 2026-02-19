import { useCallback, useEffect, useRef } from 'react';
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
import { createLogger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { updateSyncAtom } from '@/store/sync-atoms';
import type { VariableDefinition } from '@/types';

const log = createLogger('variables');

export function useBusinessVariables() {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const variables = useAtomValue(businessVariablesAtom);
  const isLoaded = useAtomValue(businessVariablesLoadedAtom);
  const setVariables = useSetAtom(businessVariablesAtom);
  const setLoaded = useSetAtom(businessVariablesLoadedAtom);
  const setSyncStatus = useSetAtom(updateSyncAtom);

  // Debounce ref for updateVariableValue
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestVarsRef = useRef<Record<string, VariableDefinition> | null>(null);

  // Keep latestVarsRef in sync for flush-on-unmount
  useEffect(() => {
    latestVarsRef.current = variables;
  }, [variables]);

  // Flush pending debounced save on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        if (businessId && latestVarsRef.current) {
          saveBusinessVariables(businessId, latestVarsRef.current).catch(() => {
            // best-effort flush on unmount
          });
        }
      }
    };
  }, [businessId]);

  // Shared persist helper — reports sync status and retries
  const persistVariables = useCallback(
    async (vars: Record<string, VariableDefinition>) => {
      if (!businessId) return;
      setSyncStatus({ domain: 'variables', state: 'saving' });
      try {
        await withRetry(() => saveBusinessVariables(businessId, vars));
        setSyncStatus({ domain: 'variables', state: 'saved', lastSaved: Date.now() });
        log.info('saved', { businessId });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Variable save failed';
        setSyncStatus({ domain: 'variables', state: 'error', error: message });
        log.error('save.failed', { businessId, error: message });
      }
    },
    [businessId, setSyncStatus],
  );

  // Load variables from Firestore
  async function loadVariables() {
    if (!businessId) return;
    try {
      const vars = await getBusinessVariables(businessId);
      setVariables(vars);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.warn('load.failed', { businessId, error: message });
    } finally {
      setLoaded(true);
    }
  }

  // Save all variables to Firestore (called after mutations)
  async function saveVariables(vars: Record<string, VariableDefinition>) {
    if (!businessId) return;
    setVariables(vars);
    persistVariables(vars);
  }

  // Update a single variable's value (for input variables)
  // Debounced: rapid slider changes are batched into a single write
  function updateVariableValue(variableId: string, newValue: number) {
    if (!variables) return;
    const updated = {
      ...variables,
      [variableId]: { ...variables[variableId], value: newValue },
    };
    setVariables(updated);

    if (!businessId) return;

    // Cancel any pending debounced save
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      persistVariables(updated);
    }, 500);
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
      persistVariables(updated);
    }
  }

  // Remove a variable (and clean up references in other formulas' dependsOn)
  function removeVariable(variableId: string) {
    if (!variables) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      persistVariables(cleaned);
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
      persistVariables(updated);
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
