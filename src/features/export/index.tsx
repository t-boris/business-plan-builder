import { useState, useEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { scenarioNameAtom } from '@/store/scenario-atoms';
import { evaluatedValuesAtom } from '@/store/derived-atoms';
import { activeBusinessAtom, activeBusinessIdAtom, businessVariablesAtom } from '@/store/business-atoms';
import { SECTION_SLUGS } from '@/lib/constants';
import { useSection } from '@/hooks/use-section';
import { listScenarioData } from '@/lib/business-firestore';
import { evaluateVariables } from '@/lib/formula-engine';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { FileText, Download, Loader2 } from 'lucide-react';
import { BusinessPlanView } from './business-plan-view';
import { useChartCapture } from './pdf/useChartCapture';
import type {
  ExecutiveSummary,
  MarketAnalysis,
  ProductService,
  MarketingStrategy,
  Operations,
  FinancialProjections,
  RisksDueDiligence,
  KpisMetrics,
  LaunchPlan,
  DynamicScenario,
  VariableDefinition,
  VariableUnit,
  ScenarioAssumption,
} from '@/types';

// --- ScenarioPack interface for export ---
export interface ScenarioPack {
  active: { name: string; status: string; horizon: number; assumptions: ScenarioAssumption[] };
  scenarios: Array<{
    name: string;
    status: string;
    metrics: Record<string, { label: string; value: number; unit: string }>;
  }>;
}

// --- Scenario evaluation helper (same pattern as ScenarioComparison) ---
function evaluateScenario(
  scenario: DynamicScenario,
  definitions: Record<string, VariableDefinition>,
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

// --- Format helpers for scenario appendix ---
function formatExportValue(value: number, unit: VariableUnit, currencyCode: string): string {
  if (unit === 'currency') {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(value);
    } catch {
      return '$' + Math.round(value).toLocaleString('en-US');
    }
  }
  if (unit === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (unit === 'ratio') return value.toFixed(2);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

// Default data (same defaults as business-plan-view and individual section pages)
const defaultExecutiveSummary: ExecutiveSummary = {
  summary: '',
  mission: '',
  vision: '',
  keyHighlights: [],
};

const defaultMarketAnalysis: MarketAnalysis = {
  enabledBlocks: { sizing: true, competitors: true, demographics: true, acquisitionFunnel: true, adoptionModel: true, customMetrics: true },
  marketSizing: {
    tam: { approach: 'top-down', steps: [] },
    sam: { steps: [] },
    som: { steps: [] },
  },
  marketNarrative: '',
  competitors: [],
  demographics: { population: 0, income: '', metrics: [] },
  acquisitionFunnel: [],
  adoptionModel: { type: 's-curve', totalMarket: 10000, initialUsers: 50, growthRate: 0.3, projectionMonths: 24 },
  customMetrics: [],
};

const defaultProductService: ProductService = {
  overview: '',
  offerings: [],
  addOns: [],
};

const defaultMarketing: MarketingStrategy = {
  channels: [],
  offers: [],
  landingPage: { url: '', description: '' },
};

const defaultOperations: Operations = {
  workforce: [],
  capacityItems: [],
  variableComponents: [],
  costItems: [],
  equipment: [],
  safetyProtocols: [],
  operationalMetrics: [],
};

const defaultFinancials: FinancialProjections = {
  startingCash: 0,
  months: [],
  unitEconomics: { pricePerUnit: 0, variableCostPerUnit: 0, profitPerUnit: 0, breakEvenUnits: 0 },
  seasonCoefficients: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

const defaultRisks: RisksDueDiligence = {
  risks: [],
  complianceChecklist: [],
};

const defaultKpis: KpisMetrics = { targets: { monthlyLeads: 0, conversionRate: 0, pricePerUnit: 0, cacPerLead: 0, cacPerBooking: 0, monthlyBookings: 0 } };

const defaultLaunchPlan: LaunchPlan = { stages: [] };

export function Export() {
  const scenarioName = useAtomValue(scenarioNameAtom);
  const evaluated = useAtomValue(evaluatedValuesAtom);
  const business = useAtomValue(activeBusinessAtom);
  const businessId = useAtomValue(activeBusinessIdAtom);
  const definitions = useAtomValue(businessVariablesAtom);

  // Derive business identity
  const businessName = business?.profile.name ?? 'Business Plan';
  const currencyCode = business?.profile.currency ?? 'USD';
  const enabledSections = business?.enabledSections ?? SECTION_SLUGS;

  // Build dynamic scenarioMetrics from computed evaluated variables
  const scenarioMetrics = useMemo(() => {
    if (!definitions) return {};
    const metrics: Record<string, { label: string; value: number; unit: string }> = {};
    for (const [id, def] of Object.entries(definitions)) {
      if (def.type === 'computed') {
        metrics[id] = { label: def.label, value: evaluated[id] ?? 0, unit: def.unit };
      }
    }
    return metrics;
  }, [definitions, evaluated]);

  // --- Load all scenarios for export appendix ---
  const [allScenarios, setAllScenarios] = useState<DynamicScenario[]>([]);
  useEffect(() => {
    if (!businessId) return;
    let mounted = true;
    listScenarioData(businessId)
      .then((list) => { if (mounted) setAllScenarios(list); })
      .catch(() => { /* silently ignore - appendix will be empty */ });
    return () => { mounted = false; };
  }, [businessId]);

  // Filter to non-archived scenarios and evaluate each
  const scenarioPack = useMemo<ScenarioPack | null>(() => {
    if (!definitions || allScenarios.length === 0) return null;

    const nonArchived = allScenarios.filter((s) => s.status !== 'archived');
    if (nonArchived.length === 0) return null;

    // Find active scenario (status === 'active'), fallback to first
    const activeScenario = nonArchived.find((s) => s.status === 'active') ?? nonArchived[0];

    // Key metric variable IDs: only currency, percent, count units
    const keyVarIds = Object.entries(definitions)
      .filter(([, def]) => def.type === 'computed' && ['currency', 'percent', 'count'].includes(def.unit))
      .map(([id]) => id);

    const scenarioEntries = nonArchived.map((s) => {
      const evaluated = evaluateScenario(s, definitions);
      const metrics: Record<string, { label: string; value: number; unit: string }> = {};
      for (const varId of keyVarIds) {
        const def = definitions[varId];
        metrics[varId] = { label: def.label, value: evaluated[varId] ?? 0, unit: def.unit };
      }
      return {
        name: s.metadata.name,
        status: s.status ?? 'draft',
        metrics,
      };
    });

    return {
      active: {
        name: activeScenario.metadata.name,
        status: activeScenario.status ?? 'draft',
        horizon: activeScenario.horizonMonths ?? 12,
        assumptions: activeScenario.assumptions ?? [],
      },
      scenarios: scenarioEntries,
    };
  }, [definitions, allScenarios]);

  // Determine recommendation (highest profit-related metric)
  const recommendation = useMemo<string | null>(() => {
    if (!scenarioPack || scenarioPack.scenarios.length < 2 || !definitions) return null;

    // Find a profit-related variable
    const profitVarId = Object.entries(definitions).find(([, def]) => {
      if (def.type !== 'computed') return false;
      const lower = def.label.toLowerCase();
      return lower.includes('profit') || lower.includes('net income') || lower.includes('margin');
    })?.[0];

    if (!profitVarId) return null;

    let bestName = '';
    let bestValue = -Infinity;
    for (const s of scenarioPack.scenarios) {
      const val = s.metrics[profitVarId]?.value ?? 0;
      if (val > bestValue) {
        bestValue = val;
        bestName = s.name;
      }
    }

    if (!bestName) return null;
    return `Based on financial metrics, "${bestName}" appears strongest.`;
  }, [scenarioPack, definitions]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chart capture for PDF
  const { ref: chartRef, captureChart } = useChartCapture();

  // Load all section data for PDF export
  const { data: execSummary } = useSection<ExecutiveSummary>('executive-summary', defaultExecutiveSummary);
  const { data: marketAnalysis } = useSection<MarketAnalysis>('market-analysis', defaultMarketAnalysis);
  const { data: productService } = useSection<ProductService>('product-service', defaultProductService);
  const { data: marketingStrategy } = useSection<MarketingStrategy>('marketing-strategy', defaultMarketing);
  const { data: operations } = useSection<Operations>('operations', defaultOperations);
  const { data: financials } = useSection<FinancialProjections>('financial-projections', defaultFinancials);
  const { data: risks } = useSection<RisksDueDiligence>('risks-due-diligence', defaultRisks);
  const { data: kpis } = useSection<KpisMetrics>('kpis-metrics', defaultKpis);
  const { data: launchPlan } = useSection<LaunchPlan>('launch-plan', defaultLaunchPlan);

  async function handleDownloadPdf() {
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Capture chart image
      const chartImage = await captureChart();

      // 2. Dynamically import PDF generator and file-saver
      const [{ generateBusinessPlanPdf }, { saveAs }] = await Promise.all([
        import('./pdf/generatePdf'),
        import('file-saver'),
      ]);

      // 3. Generate PDF blob
      const blob = await generateBusinessPlanPdf({
        sections: {
          execSummary,
          marketAnalysis,
          productService,
          marketingStrategy,
          operations,
          financials,
          risks,
          kpis,
          launchPlan,
        },
        enabledSections,
        scenarioMetrics,
        scenarioName,
        chartImage,
        businessName,
        currencyCode,
        scenarioPack,
      });

      // 4. Trigger download with business name in filename
      const sanitizedName = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      saveAs(blob, `${sanitizedName}-business-plan.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Export"
        description="Preview and download your business plan"
      />

      <Tabs defaultValue="business-plan">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-4 px-0 h-auto pb-0">
          <TabsTrigger
            value="business-plan"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-1 pb-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
          >
            <FileText className="size-3.5 mr-1.5" />
            Business Plan
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-1 pb-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
          >
            <Download className="size-3.5 mr-1.5" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-plan" className="mt-6">
          <BusinessPlanView chartAnimationDisabled={false} chartContainerRef={chartRef} />

          {/* Scenario Analysis Appendix */}
          {scenarioPack && (
            <div className="max-w-4xl mx-auto px-6 py-8 border-t mt-4">
              <h2 className="text-xl font-bold tracking-tight border-b pb-2 pt-4 mb-6">
                <span className="text-muted-foreground mr-2">Appendix.</span>
                Scenario Analysis
              </h2>

              {/* Active Scenario Summary */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Scenario</h3>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-sm">{scenarioPack.active.name}</span>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      scenarioPack.active.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-300'
                        : 'bg-gray-100 text-gray-700 ring-gray-300'
                    }`}>
                      {scenarioPack.active.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Horizon: {scenarioPack.active.horizon} months</p>
                  {scenarioPack.active.assumptions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Assumptions</p>
                      <ul className="list-disc list-inside text-sm space-y-0.5">
                        {scenarioPack.active.assumptions.map((a) => (
                          <li key={a.id}>
                            <span className="font-medium">{a.label}:</span> {a.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison Table */}
              {scenarioPack.scenarios.length > 1 && (() => {
                // Get all metric keys from the first scenario
                const metricKeys = Object.keys(scenarioPack.scenarios[0].metrics);
                return (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Scenario Comparison</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-2 px-3 font-medium border-b">Metric</th>
                            {scenarioPack.scenarios.map((s) => (
                              <th key={s.name} className="text-right py-2 px-3 font-medium border-b">{s.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {metricKeys.map((varId, i) => {
                            const firstMetric = scenarioPack.scenarios[0].metrics[varId];
                            // Find best value (highest for most, could be refined)
                            const values = scenarioPack.scenarios.map((s) => s.metrics[varId]?.value ?? 0);
                            const bestValue = Math.max(...values);
                            return (
                              <tr key={varId} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                                <td className="py-2 px-3 border-b font-medium">{firstMetric.label}</td>
                                {scenarioPack.scenarios.map((s) => {
                                  const m = s.metrics[varId];
                                  const isBest = scenarioPack.scenarios.length > 1 && m.value === bestValue && values.filter((v) => v === bestValue).length === 1;
                                  return (
                                    <td key={s.name} className={`py-2 px-3 border-b text-right tabular-nums ${isBest ? 'font-bold text-emerald-700' : ''}`}>
                                      {formatExportValue(m.value, m.unit as VariableUnit, currencyCode)}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Recommendation */}
              {recommendation && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">{recommendation}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <div className="card-elevated rounded-lg">
            <div className="p-4 border-b">
              <h3 className="text-sm font-semibold">Export Options</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download your business plan as a professionally formatted PDF document.
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active Scenario</p>
                  <p className="text-xs text-muted-foreground">
                    Metrics from this scenario will be included in the export.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  {scenarioName}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Generated on</p>
                  <p className="text-xs text-muted-foreground">{currentDate}</p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="size-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>

              {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                The PDF includes all enabled sections, financial charts, and scenario metrics.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
