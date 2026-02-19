import { useEffect, useRef } from 'react';
import { Provider as JotaiProvider, useSetAtom, useAtomValue } from 'jotai';
import { onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter } from 'react-router';
import { auth } from '@/lib/firebase';
import { authStateAtom, authStatusAtom } from '@/store/auth-atoms';
import {
  activeBusinessIdAtom,
  businessVariablesAtom,
  businessVariablesLoadedAtom,
  businessVariablesLoadFailedAtom,
} from '@/store/business-atoms';
import {
  scenarioListAtom,
  loadDynamicScenarioAtom,
  scenarioSyncReadyAtom,
} from '@/store/scenario-atoms';
import { listScenarioData, getScenarioPreferences, saveScenarioData, saveScenarioPreferences, getBusinessVariables } from '@/lib/business-firestore';
import { useScenarioSync } from '@/hooks/use-scenario-sync';
import { useBusinesses } from '@/hooks/use-businesses';
import { createLogger } from '@/lib/logger';
import type { DynamicScenario } from '@/types';

const log = createLogger('providers');

function AuthListener({ children }: { children: React.ReactNode }) {
  const setAuthState = useSetAtom(authStateAtom);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAuthState({ status: 'unauthenticated', user: null });
        return;
      }

      setAuthState({
        status: 'authenticated',
        user,
      });
    });

    return unsubscribe;
  }, [setAuthState]);

  return children;
}

function BusinessLoader() {
  const authStatus = useAtomValue(authStatusAtom);
  const { loadBusinesses } = useBusinesses();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (authStatus !== 'authenticated' || loadedRef.current) return;
    loadedRef.current = true;
    loadBusinesses();
  }, [authStatus, loadBusinesses]);

  return null;
}

function VariableLoader() {
  const authStatus = useAtomValue(authStatusAtom);
  const businessId = useAtomValue(activeBusinessIdAtom);
  const setVariables = useSetAtom(businessVariablesAtom);
  const setLoaded = useSetAtom(businessVariablesLoadedAtom);
  const setLoadFailed = useSetAtom(businessVariablesLoadFailedAtom);
  const prevBusinessIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset on business change
    if (prevBusinessIdRef.current !== businessId) {
      if (prevBusinessIdRef.current !== null) {
        setVariables(null);
        setLoaded(false);
        setLoadFailed(false);
      }
      prevBusinessIdRef.current = businessId;
    }

    if (authStatus !== 'authenticated' || !businessId) return;

    async function init() {
      try {
        const vars = await getBusinessVariables(businessId!);
        setVariables(vars);
        setLoadFailed(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        log.warn('variables.load.failed', { businessId: businessId!, error: message });
        setLoadFailed(true);
      } finally {
        setLoaded(true);
      }
    }
    init();
  }, [authStatus, businessId, setVariables, setLoaded, setLoadFailed]);

  return null;
}

function ScenarioSync() {
  const authStatus = useAtomValue(authStatusAtom);
  const businessId = useAtomValue(activeBusinessIdAtom);
  const variables = useAtomValue(businessVariablesAtom);
  const variablesLoaded = useAtomValue(businessVariablesLoadedAtom);
  const variableLoadFailed = useAtomValue(businessVariablesLoadFailedAtom);
  const setScenarioList = useSetAtom(scenarioListAtom);
  const loadDynamicScenario = useSetAtom(loadDynamicScenarioAtom);
  const setSyncReady = useSetAtom(scenarioSyncReadyAtom);
  const loadedRef = useRef(false);
  const prevBusinessIdRef = useRef<string | null>(null);

  // Load scenarios from Firestore on auth + business + variables change
  useEffect(() => {
    // Detect business change — reset loaded state to re-initialize
    if (prevBusinessIdRef.current !== businessId) {
      if (prevBusinessIdRef.current !== null) {
        // Business actually changed (not first render) — reset state
        loadedRef.current = false;
        setSyncReady(false);
        setScenarioList([]);
      }
      prevBusinessIdRef.current = businessId;
    }

    if (authStatus !== 'authenticated' || loadedRef.current) return;
    if (!businessId) return;
    if (!variablesLoaded) return;
    loadedRef.current = true;

    async function init() {
      try {
        const scenarios = await listScenarioData(businessId!);

        if (scenarios.length === 0 && variables && !variableLoadFailed) {
          // No scenarios exist and variables loaded successfully — create baseline from variable definitions
          const defaultValues: Record<string, number> = {};
          for (const [id, def] of Object.entries(variables)) {
            if (def.type === 'input') {
              defaultValues[id] = def.defaultValue;
            }
          }

          const baseline: DynamicScenario = {
            metadata: {
              id: 'baseline',
              name: 'Baseline',
              description: '',
              createdAt: new Date().toISOString(),
              isBaseline: true,
            },
            values: defaultValues,
          };
          await saveScenarioData(businessId!, baseline);
          await saveScenarioPreferences(businessId!, { activeScenarioId: 'baseline' });
          setScenarioList([baseline.metadata]);
          loadDynamicScenario(baseline);
        } else if (scenarios.length === 0) {
          // No scenarios and variables failed to load or are null — skip baseline creation
          log.warn('baseline.skipped', {
            businessId: businessId!,
            reason: variableLoadFailed ? 'variable load failed' : 'no variables defined',
          });
        } else {
          setScenarioList(scenarios.map((s) => s.metadata));

          // Determine which scenario to load
          const prefs = await getScenarioPreferences(businessId!);
          const activeId = prefs?.activeScenarioId;
          const target =
            scenarios.find((s) => s.metadata.id === activeId) ??
            scenarios.find((s) => s.metadata.isBaseline) ??
            scenarios[0];
          loadDynamicScenario(target);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        log.warn('scenarios.load.failed', { businessId: businessId!, error: message });
      } finally {
        setSyncReady(true);
      }
    }

    init();
  }, [authStatus, businessId, variablesLoaded, variables, variableLoadFailed, setScenarioList, loadDynamicScenario, setSyncReady]);

  // Wire up auto-save
  useScenarioSync();

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <AuthListener>
        <BusinessLoader />
        <VariableLoader />
        <ScenarioSync />
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthListener>
    </JotaiProvider>
  );
}
