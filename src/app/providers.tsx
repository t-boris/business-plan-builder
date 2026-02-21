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
  sectionDerivedScopeAtom,
  sectionScopeVersionAtom,
  seasonCoefficientsAtom,
} from '@/store/business-atoms';
import {
  scenarioListAtom,
  loadDynamicScenarioAtom,
  scenarioSyncReadyAtom,
} from '@/store/scenario-atoms';
import { listScenarioData, getScenarioPreferences, saveScenarioData, saveScenarioPreferences, getBusinessVariables, getSectionData } from '@/lib/business-firestore';
import { normalizeOperations } from '@/features/sections/operations/normalize';
import { computeOperationsCosts } from '@/features/sections/operations/compute';
import type { Operations, FinancialProjections, MarketingStrategy, KpisMetrics, MonthlyCosts } from '@/types';
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
          // No scenarios exist — create baseline with empty values.
          // All inputs derive from section scope (current reality) at evaluation time.
          const baseline: DynamicScenario = {
            metadata: {
              id: 'baseline',
              name: 'Baseline',
              description: '',
              createdAt: new Date().toISOString(),
              isBaseline: true,
            },
            values: {},
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

function sumMonthlyCosts(costs: MonthlyCosts): number {
  return costs.marketing + costs.labor + costs.supplies + costs.museum + costs.transport + (costs.fixed ?? 0);
}

/**
 * Loads key section data and derives scope variables for the formula engine.
 * This bridges the gap between section data (Operations, Financial Projections, etc.)
 * and the variable library so formulas always use up-to-date numbers.
 */
function SectionScopeLoader() {
  const authStatus = useAtomValue(authStatusAtom);
  const businessId = useAtomValue(activeBusinessIdAtom);
  const scopeVersion = useAtomValue(sectionScopeVersionAtom);
  const setSectionScope = useSetAtom(sectionDerivedScopeAtom);
  const setSeasonCoefficients = useSetAtom(seasonCoefficientsAtom);
  const prevBusinessIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset on business change
    if (prevBusinessIdRef.current !== businessId) {
      if (prevBusinessIdRef.current !== null) {
        setSectionScope({});
      }
      prevBusinessIdRef.current = businessId;
    }

    if (authStatus !== 'authenticated' || !businessId) return;

    let cancelled = false;

    async function load() {
      try {
        const [ops, financials, marketing, kpis] = await Promise.all([
          getSectionData<Operations>(businessId!, 'operations'),
          getSectionData<FinancialProjections>(businessId!, 'financial-projections'),
          getSectionData<MarketingStrategy>(businessId!, 'marketing-strategy'),
          getSectionData<KpisMetrics>(businessId!, 'kpis-metrics'),
        ]);

        if (cancelled) return;

        const scope: Record<string, number> = {};

        // Operations-derived
        if (ops) {
          try {
            const normalized = normalizeOperations(ops);
            const summary = computeOperationsCosts(normalized);
            scope.monthlyLaborCost = summary.workforceMonthlyTotal;
            scope.workforceMonthlyTotal = summary.workforceMonthlyTotal;
            scope.monthlyFixedCosts = summary.fixedMonthlyTotal;
            scope.fixedMonthlyTotal = summary.fixedMonthlyTotal;
            scope.monthlyVariableCosts = summary.variableMonthlyTotal;
            scope.variableMonthlyTotal = summary.variableMonthlyTotal;
            scope.monthlyOperationsCost = summary.monthlyOperationsTotal;
            scope.variableCostPerUnit = summary.variableCostPerOutput;
            scope.variableCostPerOutput = summary.variableCostPerOutput;
            scope.plannedOutputPerMonth = summary.totalPlannedOutputPerMonth;
            scope.totalPlannedOutputPerMonth = summary.totalPlannedOutputPerMonth;
          } catch {
            // Silently skip if operations data is malformed
          }
        }

        // Financial Projections-derived
        if (financials?.months?.length) {
          const n = financials.months.length;
          const totalRev = financials.months.reduce((s, m) => s + m.revenue, 0);
          const totalCost = financials.months.reduce((s, m) => s + sumMonthlyCosts(m.costs), 0);
          scope.monthlyRevenue = totalRev / n;
          scope.annualRevenue = totalRev;
          scope.monthlyCosts = totalCost / n;
          scope.monthlyTotalCosts = totalCost / n;
          scope.annualCosts = totalCost;
          scope.monthlyProfit = (totalRev - totalCost) / n;
          scope.annualProfit = totalRev - totalCost;
          scope.grossProfit = (totalRev - (scope.monthlyVariableCosts ?? 0) * n) / n;
          scope.costOfGoodsSold = scope.monthlyVariableCosts ?? 0;
          // Unit economics from section if present
          if (financials.unitEconomics) {
            if (financials.unitEconomics.pricePerUnit > 0) {
              scope.pricePerUnit = financials.unitEconomics.pricePerUnit;
            }
            if (financials.unitEconomics.variableCostPerUnit > 0) {
              scope.variableCostPerUnit = financials.unitEconomics.variableCostPerUnit;
            }
            scope.profitPerUnit = financials.unitEconomics.profitPerUnit ?? 0;
            scope.breakEvenUnits = financials.unitEconomics.breakEvenUnits ?? 0;
            scope.monthlyBreakEvenUnits = financials.unitEconomics.breakEvenUnits ?? 0;
          }
        }

        // Marketing-derived
        if (marketing?.channels?.length) {
          scope.monthlyMarketingBudget = marketing.channels.reduce(
            (s, c) => s + (c.budget ?? 0), 0,
          );
          scope.monthlyMarketingLeads = marketing.channels.reduce(
            (s, c) => s + (c.expectedLeads ?? 0), 0,
          );
        }

        // KPIs-derived
        if (kpis?.targets) {
          if (kpis.targets.pricePerUnit > 0) scope.pricePerUnit = kpis.targets.pricePerUnit;
          scope.monthlyBookings = kpis.targets.monthlyBookings;
          scope.monthlyTransactions = kpis.targets.monthlyBookings;
          // Normalize conversionRate: should be 0-1 decimal, not whole number percent
          scope.conversionRate = kpis.targets.conversionRate > 1
            ? kpis.targets.conversionRate / 100
            : kpis.targets.conversionRate;
          scope.cacPerLead = kpis.targets.cacPerLead;
          scope.cacPerBooking = kpis.targets.cacPerBooking;
          scope.monthlyLeads = kpis.targets.monthlyLeads;
        }

        setSectionScope(scope);

        // Extract season coefficients from financial projections
        if (financials?.seasonCoefficients?.length === 12) {
          setSeasonCoefficients(financials.seasonCoefficients);
        }
      } catch (err) {
        log.warn('section-scope.load.failed', {
          businessId: businessId!,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    load();
    return () => { cancelled = true; };
  // scopeVersion triggers reload after section saves
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, businessId, scopeVersion, setSectionScope]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <AuthListener>
        <BusinessLoader />
        <VariableLoader />
        <SectionScopeLoader />
        <ScenarioSync />
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthListener>
    </JotaiProvider>
  );
}
