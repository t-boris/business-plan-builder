import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { listScenarioData } from '@/lib/business-firestore.ts';
import { activeBusinessIdAtom, businessVariablesAtom } from '@/store/business-atoms.ts';
import { evaluateVariables } from '@/lib/formula-engine.ts';
import type { DynamicScenario, VariableDefinition } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Plus, X, Scale } from 'lucide-react';

// --- Types ---

interface DecisionCriterion {
  id: string;
  label: string;
  weight: number; // 1-10, default 5
  type: 'higher-is-better' | 'lower-is-better';
  source: 'auto' | 'manual';
  // auto: linked to a computed variable by ID
  variableId?: string;
  // manual: user provides score per scenario
  manualScores?: Record<string, number>; // scenarioId -> score (1-10)
}

// --- Helpers ---

function evaluateScenario(
  scenario: DynamicScenario,
  definitions: Record<string, VariableDefinition>
): Record<string, number> {
  const merged: Record<string, VariableDefinition> = {};
  for (const [id, def] of Object.entries(definitions)) {
    if (def.type === 'input') {
      merged[id] = { ...def, value: scenario.values[id] ?? def.value };
    } else {
      merged[id] = def;
    }
  }
  try {
    return evaluateVariables(merged);
  } catch {
    const fallback: Record<string, number> = {};
    for (const [id, def] of Object.entries(merged)) {
      fallback[id] = def.value;
    }
    return fallback;
  }
}

/**
 * Normalize raw values to a 0-100 scale across all scenarios.
 * For lower-is-better criteria, the score is inverted.
 */
function normalizeScore(
  value: number,
  min: number,
  max: number,
  lowerIsBetter: boolean
): number {
  if (min === max) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return lowerIsBetter ? 100 - normalized : normalized;
}

function generateId(): string {
  return crypto.randomUUID();
}

// --- Default criteria from variable definitions ---

function buildDefaultCriteria(
  definitions: Record<string, VariableDefinition> | null
): DecisionCriterion[] {
  if (!definitions) return [];
  const criteria: DecisionCriterion[] = [];
  const computed = Object.values(definitions).filter((v) => v.type === 'computed');

  // Revenue
  const revenueVar = computed.find((v) => v.label.toLowerCase().includes('revenue'));
  if (revenueVar) {
    criteria.push({
      id: generateId(),
      label: 'Revenue',
      weight: 5,
      type: 'higher-is-better',
      source: 'auto',
      variableId: revenueVar.id,
    });
  }

  // Costs
  const costVar = computed.find((v) => v.label.toLowerCase().includes('cost'));
  if (costVar) {
    criteria.push({
      id: generateId(),
      label: 'Costs',
      weight: 5,
      type: 'lower-is-better',
      source: 'auto',
      variableId: costVar.id,
    });
  }

  // Profit
  const profitVar = computed.find((v) => v.label.toLowerCase().includes('profit'));
  if (profitVar) {
    criteria.push({
      id: generateId(),
      label: 'Profit',
      weight: 5,
      type: 'higher-is-better',
      source: 'auto',
      variableId: profitVar.id,
    });
  }

  return criteria;
}

// --- Component ---

export function DecisionMatrix({ canEdit }: { canEdit: boolean }) {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const definitions = useAtomValue(businessVariablesAtom);

  const [scenarios, setScenarios] = useState<DynamicScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [criteria, setCriteria] = useState<DecisionCriterion[]>([]);
  const initializedRef = useRef(false);

  // Load all scenarios
  useEffect(() => {
    if (!businessId) return;
    let mounted = true;
    setLoading(true);

    listScenarioData(businessId)
      .then((list) => {
        if (!mounted) return;
        // Filter out archived scenarios
        setScenarios(list.filter((s) => s.status !== 'archived'));
      })
      .catch(() => {
        if (!mounted) return;
        setIsOffline(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [businessId]);

  // Initialize default criteria once definitions are loaded
  useEffect(() => {
    if (initializedRef.current || !definitions) return;
    initializedRef.current = true;
    const defaults = buildDefaultCriteria(definitions);
    if (defaults.length > 0) {
      setCriteria(defaults);
    }
  }, [definitions]);

  // Evaluate all scenarios
  const evaluated = useMemo(() => {
    if (!definitions || scenarios.length === 0) return {};
    const results: Record<string, Record<string, number>> = {};
    for (const scenario of scenarios) {
      results[scenario.metadata.id] = evaluateScenario(scenario, definitions);
    }
    return results;
  }, [scenarios, definitions]);

  // Calculate normalized scores for each criterion x scenario
  const scoringMatrix = useMemo(() => {
    if (scenarios.length === 0 || criteria.length === 0) return null;

    const matrix: Record<string, Record<string, number>> = {}; // criterionId -> scenarioId -> score

    for (const criterion of criteria) {
      matrix[criterion.id] = {};

      if (criterion.source === 'auto' && criterion.variableId) {
        // Get raw values for this variable across all scenarios
        const rawValues: Record<string, number> = {};
        for (const scenario of scenarios) {
          const evalResult = evaluated[scenario.metadata.id];
          rawValues[scenario.metadata.id] = evalResult?.[criterion.variableId] ?? 0;
        }

        const values = Object.values(rawValues);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const lowerIsBetter = criterion.type === 'lower-is-better';

        for (const scenario of scenarios) {
          matrix[criterion.id][scenario.metadata.id] = normalizeScore(
            rawValues[scenario.metadata.id],
            min,
            max,
            lowerIsBetter
          );
        }
      } else if (criterion.source === 'manual') {
        // Manual scores: convert 1-10 to 0-100 scale
        for (const scenario of scenarios) {
          const manualScore = criterion.manualScores?.[scenario.metadata.id] ?? 5;
          matrix[criterion.id][scenario.metadata.id] = ((manualScore - 1) / 9) * 100;
        }
      }
    }

    return matrix;
  }, [scenarios, criteria, evaluated]);

  // Calculate weighted totals for each scenario
  const weightedTotals = useMemo(() => {
    if (!scoringMatrix || criteria.length === 0 || scenarios.length === 0) return {};

    const totals: Record<string, number> = {};
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

    if (totalWeight === 0) return {};

    for (const scenario of scenarios) {
      let weightedSum = 0;
      for (const criterion of criteria) {
        const score = scoringMatrix[criterion.id]?.[scenario.metadata.id] ?? 0;
        weightedSum += score * criterion.weight;
      }
      totals[scenario.metadata.id] = weightedSum / totalWeight;
    }

    return totals;
  }, [scoringMatrix, criteria, scenarios]);

  // Find the winning scenario
  const recommendation = useMemo(() => {
    const entries = Object.entries(weightedTotals);
    if (entries.length === 0) return null;

    entries.sort((a, b) => b[1] - a[1]);
    const [winnerId, winnerScore] = entries[0];
    const winner = scenarios.find((s) => s.metadata.id === winnerId);

    if (entries.length >= 2) {
      const [runnerId, runnerScore] = entries[1];
      const runner = scenarios.find((s) => s.metadata.id === runnerId);
      const diff = Math.abs(winnerScore - runnerScore);
      const isClose = diff <= 5; // within 5 points

      if (isClose && runner) {
        return {
          type: 'close' as const,
          winner: winner?.metadata.name ?? winnerId,
          winnerScore: winnerScore.toFixed(1),
          runner: runner.metadata.name,
          runnerScore: runnerScore.toFixed(1),
        };
      }
    }

    return {
      type: 'clear' as const,
      winner: winner?.metadata.name ?? winnerId,
      winnerScore: winnerScore.toFixed(1),
      runner: null,
      runnerScore: null,
    };
  }, [weightedTotals, scenarios]);

  // --- Criteria management callbacks ---

  const updateCriterion = useCallback((id: string, updates: Partial<DecisionCriterion>) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const removeCriterion = useCallback((id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addManualCriterion = useCallback(() => {
    setCriteria((prev) => [
      ...prev,
      {
        id: generateId(),
        label: 'Custom Criterion',
        weight: 5,
        type: 'higher-is-better',
        source: 'manual',
        manualScores: {},
      },
    ]);
  }, []);

  const setManualScore = useCallback((criterionId: string, scenarioId: string, score: number) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId
          ? { ...c, manualScores: { ...(c.manualScores ?? {}), [scenarioId]: score } }
          : c
      )
    );
  }, []);

  // --- Render states ---

  if (!businessId) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
        Select a business to use the decision matrix.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
        Loading scenarios...
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="text-amber-600 bg-amber-50 px-3 py-2 rounded text-sm">
          Offline mode - decision matrix requires saved scenarios in Firestore
        </span>
      </div>
    );
  }

  if (scenarios.length < 2) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
        Save at least 2 non-archived scenarios to use the decision matrix.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommendation banner */}
      {recommendation && (
        <div
          className={`rounded-lg border p-4 flex items-center gap-3 ${
            recommendation.type === 'close'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <Trophy
            className={`h-5 w-5 flex-shrink-0 ${
              recommendation.type === 'close' ? 'text-amber-600' : 'text-emerald-600'
            }`}
          />
          <div className="text-sm">
            {recommendation.type === 'clear' ? (
              <span>
                <strong>Recommended: {recommendation.winner}</strong>{' '}
                <span className="text-muted-foreground">(score: {recommendation.winnerScore})</span>
              </span>
            ) : (
              <span>
                <strong>Close call:</strong>{' '}
                {recommendation.winner} ({recommendation.winnerScore}) vs{' '}
                {recommendation.runner} ({recommendation.runnerScore})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Criteria editor */}
      {canEdit && (
        <div className="card-elevated rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Decision Criteria</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addManualCriterion}
              className="h-7 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Criterion
            </Button>
          </div>
          <div className="divide-y">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="px-4 py-3 flex items-center gap-4">
                {/* Label (editable for manual criteria) */}
                <div className="w-[160px] flex-shrink-0">
                  {criterion.source === 'manual' ? (
                    <Input
                      value={criterion.label}
                      onChange={(e) => updateCriterion(criterion.id, { label: e.target.value })}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {criterion.label}
                      <span className="ml-1 text-xs text-muted-foreground">(auto)</span>
                    </span>
                  )}
                </div>

                {/* Type toggle */}
                <button
                  type="button"
                  onClick={() =>
                    updateCriterion(criterion.id, {
                      type: criterion.type === 'higher-is-better' ? 'lower-is-better' : 'higher-is-better',
                    })
                  }
                  className="text-xs px-2 py-1 rounded border bg-muted/30 hover:bg-muted/50 transition-colors flex-shrink-0"
                >
                  {criterion.type === 'higher-is-better' ? 'Higher is better' : 'Lower is better'}
                </button>

                {/* Weight slider */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="text-xs text-muted-foreground w-12 flex-shrink-0">
                    Weight: {criterion.weight}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={criterion.weight}
                    onChange={(e) => updateCriterion(criterion.id, { weight: Number(e.target.value) })}
                    className="flex-1 h-1.5 accent-primary cursor-pointer"
                  />
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeCriterion(criterion.id)}
                  className="text-muted-foreground hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {criteria.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No criteria defined. Add criteria to score your scenarios.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scoring matrix table */}
      {criteria.length > 0 && scoringMatrix && (
        <div className="card-elevated rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Scoring Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Criterion</th>
                  <th className="text-center py-2.5 px-4 font-medium text-muted-foreground w-16">Weight</th>
                  {scenarios.map((s) => (
                    <th key={s.metadata.id} className="text-right py-2.5 px-4 font-medium text-foreground">
                      {s.metadata.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((criterion, i) => (
                  <tr key={criterion.id} className={`border-b last:border-0 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                    <td className="py-2 px-4 font-medium">
                      {criterion.label}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({criterion.type === 'higher-is-better' ? '+' : '-'})
                      </span>
                    </td>
                    <td className="text-center py-2 px-4 text-muted-foreground">{criterion.weight}</td>
                    {scenarios.map((s) => {
                      const score = scoringMatrix[criterion.id]?.[s.metadata.id] ?? 0;

                      if (criterion.source === 'manual' && canEdit) {
                        const manualScore = criterion.manualScores?.[s.metadata.id] ?? 5;
                        return (
                          <td key={s.metadata.id} className="text-right py-2 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={manualScore}
                                onChange={(e) => {
                                  const val = Math.min(10, Math.max(1, Number(e.target.value) || 1));
                                  setManualScore(criterion.id, s.metadata.id, val);
                                }}
                                className="w-14 h-7 text-sm text-right border rounded px-2 bg-background"
                              />
                              <span className="text-xs text-muted-foreground tabular-nums w-10">
                                ({score.toFixed(0)})
                              </span>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={s.metadata.id} className="text-right py-2 px-4">
                          <span className="tabular-nums font-medium">{score.toFixed(1)}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Weighted total row */}
                <tr className="border-t-2 bg-muted/40 font-semibold">
                  <td className="py-2.5 px-4">Weighted Total</td>
                  <td className="text-center py-2.5 px-4"></td>
                  {scenarios.map((s) => {
                    const total = weightedTotals[s.metadata.id] ?? 0;
                    const isWinner =
                      total === Math.max(...Object.values(weightedTotals)) &&
                      Object.values(weightedTotals).length > 0;
                    return (
                      <td key={s.metadata.id} className="text-right py-2.5 px-4">
                        <span className={`tabular-nums ${isWinner ? 'text-emerald-700' : ''}`}>
                          {total.toFixed(1)}
                        </span>
                        {isWinner && (
                          <Trophy className="h-3.5 w-3.5 inline-block ml-1 text-emerald-600" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {criteria.length === 0 && !canEdit && (
        <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
          No decision criteria configured. An editor can set up the scoring matrix.
        </div>
      )}
    </div>
  );
}
