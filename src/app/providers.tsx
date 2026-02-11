import { useEffect, useRef } from 'react';
import { Provider as JotaiProvider, useSetAtom, useAtomValue } from 'jotai';
import { onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter } from 'react-router';
import { auth } from '@/lib/firebase';
import { authStateAtom, authStatusAtom, ALLOWED_EMAILS } from '@/store/auth-atoms';
import { currentPlanIdAtom } from '@/store/plan-atoms';
import {
  scenarioListAtom,
  loadScenarioAtom,
  scenarioSyncReadyAtom,
} from '@/store/scenario-atoms';
import { DEFAULT_SCENARIO_VARIABLES } from '@/lib/constants';
import { listScenarios, getActiveState, saveScenario, saveActiveState } from '@/lib/firestore';
import { useScenarioSync } from '@/hooks/use-scenario-sync';
import { useBusinesses } from '@/hooks/use-businesses';
import type { Scenario } from '@/types';

function AuthListener({ children }: { children: React.ReactNode }) {
  const setAuthState = useSetAtom(authStateAtom);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAuthState({ status: 'unauthenticated', user: null });
        return;
      }

      const email = user.email?.toLowerCase() ?? '';
      const isAllowed = ALLOWED_EMAILS.includes(email as typeof ALLOWED_EMAILS[number]);

      setAuthState({
        status: isAllowed ? 'authenticated' : 'denied',
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

function ScenarioSync() {
  const authStatus = useAtomValue(authStatusAtom);
  const planId = useAtomValue(currentPlanIdAtom);
  const setScenarioList = useSetAtom(scenarioListAtom);
  const loadScenario = useSetAtom(loadScenarioAtom);
  const setSyncReady = useSetAtom(scenarioSyncReadyAtom);
  const loadedRef = useRef(false);

  // Load scenarios from Firestore on auth
  useEffect(() => {
    if (authStatus !== 'authenticated' || loadedRef.current) return;
    loadedRef.current = true;

    async function init() {
      try {
        const scenarios = await listScenarios(planId);

        if (scenarios.length === 0) {
          // No scenarios exist — create a default "Baseline"
          const baseline: Scenario = {
            metadata: {
              id: 'baseline',
              name: 'Baseline',
              description: '',
              createdAt: new Date().toISOString(),
              isBaseline: true,
            },
            variables: {
              ...DEFAULT_SCENARIO_VARIABLES,
              bookingsPerMonth: Math.round(
                DEFAULT_SCENARIO_VARIABLES.monthlyLeads *
                  DEFAULT_SCENARIO_VARIABLES.conversionRate
              ),
            },
          };
          await saveScenario(planId, baseline);
          await saveActiveState(planId, { activeScenarioId: 'baseline' });
          setScenarioList([baseline.metadata]);
          loadScenario(baseline);
        } else {
          setScenarioList(scenarios.map((s) => s.metadata));

          // Determine which scenario to load
          const activeState = await getActiveState(planId);
          const activeId = activeState?.activeScenarioId;
          const target =
            scenarios.find((s) => s.metadata.id === activeId) ??
            scenarios.find((s) => s.metadata.isBaseline) ??
            scenarios[0];
          loadScenario(target);
        }
      } catch {
        // Firestore may not be available — use defaults silently
      } finally {
        setSyncReady(true);
      }
    }

    init();
  }, [authStatus, planId, setScenarioList, loadScenario, setSyncReady]);

  // Wire up auto-save
  useScenarioSync();

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <AuthListener>
        <BusinessLoader />
        <ScenarioSync />
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthListener>
    </JotaiProvider>
  );
}
