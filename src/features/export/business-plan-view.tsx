import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useSection } from '@/hooks/use-section';
import { SECTION_SLUGS, SECTION_LABELS } from '@/lib/constants';
import { scenarioNameAtom } from '@/store/scenario-atoms';
import { evaluatedValuesAtom } from '@/store/derived-atoms';
import { activeBusinessAtom, businessVariablesAtom } from '@/store/business-atoms';
import { StatCard } from '@/components/stat-card';
import { normalizeProductService } from '@/features/sections/product-service/normalize';
import { normalizeOperations } from '@/features/sections/operations/normalize';
import { computeOperationsCosts } from '@/features/sections/operations/compute';
import type {
  ExecutiveSummary,
  MarketAnalysis,
  MarketSizing,
  CalcStep,
  ProductService,
  MarketingStrategy,
  Operations,
  FinancialProjections as FinancialProjectionsType,
  RisksDueDiligence,
  KpisMetrics,
  LaunchPlan,
  RiskSeverity,
  ComplianceStatus,
  TaskStatus,
  InvestmentVerdict,
  DueDiligencePriority,
  SectionSlug,
} from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { computeTam, computeSam, computeSom } from '@/features/sections/market-analysis/lib/sizing-math';

// ---- Default data (same as individual section pages) ----

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
  capacity: { outputUnitLabel: '', plannedOutputPerMonth: 0, maxOutputPerDay: 0, maxOutputPerWeek: 0, maxOutputPerMonth: 0, utilizationRate: 0 },
  costItems: [],
  equipment: [],
  safetyProtocols: [],
  operationalMetrics: [],
};

const defaultFinancials: FinancialProjectionsType = {
  months: [],
  unitEconomics: { avgCheck: 0, costPerEvent: 0, profitPerEvent: 0, breakEvenEvents: 0 },
  seasonCoefficients: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

const defaultRisks: RisksDueDiligence = {
  risks: [],
  complianceChecklist: [],
};

const defaultKpis: KpisMetrics = { targets: { monthlyLeads: 0, conversionRate: 0, avgCheck: 0, cacPerLead: 0, cacPerBooking: 0, monthlyBookings: 0 } };

const defaultLaunchPlan: LaunchPlan = { stages: [] };

// ---- Helpers ----

function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function getSemanticColor(label: string): string {
  const lower = label.toLowerCase();
  if (/revenue|income|sales/.test(lower)) return 'var(--chart-revenue)';
  if (/cost|expense|spend/.test(lower)) return 'var(--chart-cost)';
  if (/profit|net|margin/.test(lower)) return 'var(--chart-profit)';
  return 'var(--chart-neutral)';
}

const severityStyles: Record<RiskSeverity, string> = {
  critical: 'bg-red-200 text-red-900',
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-green-100 text-green-800',
};

const verdictBorderColors: Record<InvestmentVerdict, string> = {
  'strong-go': 'border-l-green-500 bg-green-50',
  'conditional-go': 'border-l-amber-500 bg-amber-50',
  'proceed-with-caution': 'border-l-orange-500 bg-orange-50',
  'defer': 'border-l-red-400 bg-red-50',
  'no-go': 'border-l-red-600 bg-red-100',
};

const verdictLabels: Record<InvestmentVerdict, string> = {
  'strong-go': 'Strong Go',
  'conditional-go': 'Conditional Go',
  'proceed-with-caution': 'Proceed with Caution',
  'defer': 'Defer',
  'no-go': 'No-Go',
};

const priorityStyles: Record<DueDiligencePriority, string> = {
  required: 'bg-red-100 text-red-800',
  advised: 'bg-blue-100 text-blue-800',
};

const complianceStatusStyles: Record<ComplianceStatus, string> = {
  'not-started': 'bg-gray-100 text-gray-800',
  pending: 'bg-amber-100 text-amber-800',
  complete: 'bg-green-100 text-green-800',
};

const taskStatusStyles: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};

const taskStatusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  done: 'Done',
};

// ---- Section Header ----

function SectionHeader({ number, title, id }: { number: number; title: string; id: string }) {
  return (
    <h2 id={id} className="text-xl font-bold tracking-tight border-b pb-2 pt-8 scroll-mt-6">
      <span className="text-muted-foreground mr-2">{number}.</span>
      {title}
    </h2>
  );
}

function EmptyPlaceholder({ section }: { section: string }) {
  return (
    <p className="text-sm text-muted-foreground italic py-4">No data entered for {section}.</p>
  );
}

function formatTamShort(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function StepTypeSymbol({ type }: { type: CalcStep['type'] }) {
  if (type === 'currency') return <span>$</span>;
  if (type === 'percentage') return <span>%</span>;
  return <span>#</span>;
}

function MarketSizingExportBlock({ sizing, narrative }: { sizing: MarketSizing; narrative: string }) {
  const tamVal = computeTam(sizing.tam);
  const samVal = computeSam(sizing.tam, sizing.sam);
  const somVal = computeSom(sizing.tam, sizing.sam, sizing.som);

  function renderStepsTable(steps: CalcStep[]) {
    if (steps.length === 0) return null;
    return (
      <table className="w-full text-xs border mt-1 mb-2">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left py-1 px-2 font-medium border-b">Step</th>
            <th className="text-right py-1 px-2 font-medium border-b">Value</th>
            <th className="text-center py-1 px-2 font-medium border-b">Type</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, i) => (
            <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
              <td className="py-1 px-2 border-b">{s.label}</td>
              <td className="py-1 px-2 border-b text-right tabular-nums">
                {s.type === 'currency' ? formatCurrency(s.value) : s.value.toLocaleString()}
              </td>
              <td className="py-1 px-2 border-b text-center"><StepTypeSymbol type={s.type} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Market Sizing</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">TAM ({sizing.tam.approach})</p>
          <p className="text-lg font-bold">{tamVal > 0 ? formatTamShort(tamVal) : '---'}</p>
          {renderStepsTable(sizing.tam.steps)}
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">SAM</p>
          <p className="text-lg font-bold">{samVal > 0 ? formatTamShort(samVal) : '---'}</p>
          {renderStepsTable(sizing.sam.steps)}
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">SOM</p>
          <p className="text-lg font-bold">{somVal > 0 ? formatTamShort(somVal) : '---'}</p>
          {renderStepsTable(sizing.som.steps)}
        </div>
      </div>
      {narrative && (
        <p className="text-sm leading-relaxed mt-2">{narrative}</p>
      )}
    </div>
  );
}

// ---- Main Component ----

export interface BusinessPlanViewProps {
  /** If true, chart will not animate (for PDF capture) */
  chartAnimationDisabled?: boolean;
  /** Ref to attach to the chart container for PDF capture */
  chartContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const UNIT_PRIORITY: Record<import('@/types').VariableUnit, number> = {
  currency: 0, percent: 1, ratio: 2, count: 3, months: 4, days: 5, hours: 6,
};

const BPV_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function BusinessPlanView({ chartAnimationDisabled = false, chartContainerRef }: BusinessPlanViewProps) {
  // Business context
  const business = useAtomValue(activeBusinessAtom);

  const enabledSections = useMemo(() => {
    if (!business) return SECTION_SLUGS;
    return SECTION_SLUGS.filter((slug) => business.enabledSections.includes(slug));
  }, [business]);

  const currencyCode = business?.profile.currency ?? 'USD';

  function getSectionNumber(slug: SectionSlug): number {
    return enabledSections.indexOf(slug) + 1;
  }

  // Scenario data
  const scenarioName = useAtomValue(scenarioNameAtom);
  const definitions = useAtomValue(businessVariablesAtom);
  const evaluated = useAtomValue(evaluatedValuesAtom);

  // Load all 9 sections
  const { data: execSummary, isLoading: l1 } = useSection<ExecutiveSummary>('executive-summary', defaultExecutiveSummary);
  const { data: marketAnalysis, isLoading: l2 } = useSection<MarketAnalysis>('market-analysis', defaultMarketAnalysis);
  const { data: productService, isLoading: l3 } = useSection<ProductService>('product-service', defaultProductService);
  const { data: marketingStrategy, isLoading: l4 } = useSection<MarketingStrategy>('marketing-strategy', defaultMarketing);
  const { data: operations, isLoading: l5 } = useSection<Operations>('operations', defaultOperations);
  const { data: financials, isLoading: l6 } = useSection<FinancialProjectionsType>('financial-projections', defaultFinancials);
  const { data: risks, isLoading: l7 } = useSection<RisksDueDiligence>('risks-due-diligence', defaultRisks);
  const { data: kpis, isLoading: l8 } = useSection<KpisMetrics>('kpis-metrics', defaultKpis);
  const { data: launchPlan, isLoading: l9 } = useSection<LaunchPlan>('launch-plan', defaultLaunchPlan);

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9;

  // Dynamic KPI cards from evaluated variables (sorted by unit priority)
  const computedVariables = useMemo(() => {
    if (!definitions) return [];
    return Object.values(definitions)
      .filter((v) => v.type === 'computed')
      .sort((a, b) => (UNIT_PRIORITY[a.unit] ?? 99) - (UNIT_PRIORITY[b.unit] ?? 99));
  }, [definitions]);

  const primaryKpis = computedVariables.slice(0, 4);

  // Dynamic chart from currency variables (up to 3)
  const allVariables = useMemo(() => {
    if (!definitions) return [];
    return Object.values(definitions);
  }, [definitions]);

  const chartVariables = useMemo(() => {
    return allVariables
      .filter((v) => v.unit === 'currency')
      .slice(0, 3);
  }, [allVariables]);

  const dynamicChartData = useMemo(() => {
    return BPV_MONTHS.map((month) => {
      const point: Record<string, string | number> = { month };
      chartVariables.forEach((v) => {
        point[v.label] = evaluated[v.id] ?? 0;
      });
      return point;
    });
  }, [chartVariables, evaluated]);

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <p className="text-muted-foreground text-sm">Loading business plan...</p>
      </div>
    );
  }

  function formatKpiValue(v: { id: string; unit: string }): string {
    const val = evaluated[v.id] ?? 0;
    if (v.unit === 'currency') return formatCurrency(val, currencyCode);
    if (v.unit === 'percent') return `${(val * 100).toFixed(1)}%`;
    return String(Math.round(val));
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="text-center pb-8 border-b">
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {business?.profile.name || 'Business Plan'}
        </h1>
        <p className="text-lg text-muted-foreground">Business Plan</p>
        <p className="text-sm text-muted-foreground mt-2">{currentDate}</p>
        <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 mt-3">
          Scenario: {scenarioName}
        </span>
      </div>

      {/* Table of Contents */}
      <div className="py-8 border-b">
        <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          {enabledSections.map((slug, i) => (
            <li key={slug}>
              <a href={`#section-${i + 1}`} className="text-primary hover:underline hover:text-primary/80 transition-colors">
                {SECTION_LABELS[slug]}
              </a>
            </li>
          ))}
        </ol>
      </div>

      {/* Section 1: Executive Summary */}
      {enabledSections.includes('executive-summary') && (
        <>
          <SectionHeader number={getSectionNumber('executive-summary')} title="Executive Summary" id={`section-${getSectionNumber('executive-summary')}`} />
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Summary</h3>
              <p className="text-sm leading-relaxed">{execSummary.summary}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Mission</h3>
                <p className="text-sm leading-relaxed">{execSummary.mission}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Vision</h3>
                <p className="text-sm leading-relaxed">{execSummary.vision}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Key Highlights</h3>
              <ul className="list-disc list-inside text-sm space-y-0.5">
                {execSummary.keyHighlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Section 2: Market Analysis */}
      {enabledSections.includes('market-analysis') && (
        <>
          <SectionHeader number={getSectionNumber('market-analysis')} title="Market Analysis" id={`section-${getSectionNumber('market-analysis')}`} />
          <div className="space-y-4 py-4">
            {/* TAM / SAM / SOM */}
            {marketAnalysis.enabledBlocks?.sizing !== false && marketAnalysis.marketSizing?.tam?.steps?.length > 0 && (
              <MarketSizingExportBlock sizing={marketAnalysis.marketSizing} narrative={marketAnalysis.marketNarrative} />
            )}

            {/* Competitors */}
            {marketAnalysis.enabledBlocks?.competitors !== false && marketAnalysis.competitors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Competitors</h3>
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-2 px-3 font-medium border-b">Name</th>
                      <th className="text-left py-2 px-3 font-medium border-b">Pricing</th>
                      <th className="text-left py-2 px-3 font-medium border-b">Strengths</th>
                      <th className="text-left py-2 px-3 font-medium border-b">Weaknesses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketAnalysis.competitors.map((c, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                        <td className="py-2 px-3 border-b font-medium">{c.name}</td>
                        <td className="py-2 px-3 border-b">{c.pricing}</td>
                        <td className="py-2 px-3 border-b">{c.strengths}</td>
                        <td className="py-2 px-3 border-b">{c.weaknesses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Demographics */}
            {marketAnalysis.enabledBlocks?.demographics !== false && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Demographics</h3>
                <p className="text-sm">Population: {marketAnalysis.demographics.population.toLocaleString()}</p>
                <p className="text-sm">Income: {marketAnalysis.demographics.income}</p>
                {marketAnalysis.demographics.metrics?.map((m, i) => (
                  <p key={i} className="text-sm">{m.label}: {m.value}{m.source ? ` (${m.source})` : ''}</p>
                ))}
              </div>
            )}

            {/* Acquisition Funnel */}
            {marketAnalysis.enabledBlocks?.acquisitionFunnel !== false && marketAnalysis.acquisitionFunnel?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Acquisition Funnel</h3>
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-2 px-3 font-medium border-b">Stage</th>
                      <th className="text-left py-2 px-3 font-medium border-b">Description</th>
                      <th className="text-right py-2 px-3 font-medium border-b">Volume</th>
                      <th className="text-right py-2 px-3 font-medium border-b">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketAnalysis.acquisitionFunnel.map((s, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                        <td className="py-2 px-3 border-b font-medium">{s.label}</td>
                        <td className="py-2 px-3 border-b text-muted-foreground">{s.description}</td>
                        <td className="py-2 px-3 border-b text-right tabular-nums">{s.volume.toLocaleString()}</td>
                        <td className="py-2 px-3 border-b text-right tabular-nums">{s.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Adoption Model */}
            {marketAnalysis.enabledBlocks?.adoptionModel !== false && marketAnalysis.adoptionModel && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Adoption Model</h3>
                <p className="text-sm">Type: {marketAnalysis.adoptionModel.type === 's-curve' ? 'S-Curve (Logistic)' : 'Linear'} | Total Market: {marketAnalysis.adoptionModel.totalMarket.toLocaleString()} | Initial Users: {marketAnalysis.adoptionModel.initialUsers} | Growth Rate: {marketAnalysis.adoptionModel.growthRate} | Projection: {marketAnalysis.adoptionModel.projectionMonths} months</p>
              </div>
            )}

            {/* Custom Metrics */}
            {marketAnalysis.enabledBlocks?.customMetrics !== false && marketAnalysis.customMetrics?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Custom Metrics</h3>
                {marketAnalysis.customMetrics.map((m, i) => (
                  <p key={i} className="text-sm">{m.label}: {m.value}{m.source ? ` (${m.source})` : ''}</p>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Section 3: Product & Service */}
      {enabledSections.includes('product-service') && (() => {
        const normalizedPS = normalizeProductService(productService);
        return (
          <>
            <SectionHeader number={getSectionNumber('product-service')} title="Product & Service" id={`section-${getSectionNumber('product-service')}`} />
            <div className="space-y-4 py-4">
              {normalizedPS.overview && (
                <p className="text-sm leading-relaxed">{normalizedPS.overview}</p>
              )}

              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Offerings</h3>
              <div className="grid grid-cols-3 gap-4">
                {normalizedPS.offerings.map((offering) => (
                  <div key={offering.id} className="border rounded-lg overflow-hidden">
                    {offering.image?.url && (
                      <div className="h-24 bg-muted/30">
                        <img
                          src={offering.image.url}
                          alt={offering.image.alt || offering.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-semibold text-sm">{offering.name}</h4>
                      <p className="text-lg font-bold text-primary">
                        {offering.price != null ? formatCurrency(offering.price, currencyCode) : 'On request'}
                        {offering.priceLabel && (
                          <span className="text-xs font-normal text-muted-foreground ml-1">{offering.priceLabel}</span>
                        )}
                      </p>
                      <p className="text-xs mt-2 whitespace-pre-line">{offering.description}</p>
                      {offering.addOnIds.length > 0 && (() => {
                        const linked = offering.addOnIds
                          .map((aid) => normalizedPS.addOns.find((a) => a.id === aid))
                          .filter(Boolean);
                        if (linked.length === 0) return null;
                        return (
                          <p className="text-xs text-muted-foreground mt-2">
                            Add-ons: {linked.map((a) => `${a!.name} (${formatCurrency(a!.price, currencyCode)})`).join(', ')}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              {normalizedPS.addOns.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Add-Ons</h3>
                  <ul className="text-sm space-y-0.5">
                    {normalizedPS.addOns.map((a) => (
                      <li key={a.id}>
                        {a.name}
                        {a.description && <span className="text-muted-foreground"> -- {a.description}</span>}
                        {' -- '}
                        {formatCurrency(a.price, currencyCode)}
                        {a.priceLabel && <span className="text-xs text-muted-foreground ml-1">{a.priceLabel}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* Section 4: Marketing Strategy */}
      {enabledSections.includes('marketing-strategy') && (
        <>
          <SectionHeader number={getSectionNumber('marketing-strategy')} title="Marketing Strategy" id={`section-${getSectionNumber('marketing-strategy')}`} />
          <div className="space-y-4 py-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Channels</h3>
            <div className="grid grid-cols-2 gap-4">
              {marketingStrategy.channels.map((ch, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm">{ch.name}</h4>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>Budget: {formatCurrency(ch.budget, currencyCode)}/mo</span>
                    <span>Leads: {ch.expectedLeads}</span>
                    <span>CAC: {formatCurrency(ch.expectedCAC, currencyCode)}</span>
                  </div>
                  <p className="text-xs mt-2">{ch.description}</p>
                </div>
              ))}
            </div>

            {marketingStrategy.offers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Promotional Offers</h3>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {marketingStrategy.offers.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            )}

            {marketingStrategy.landingPage.description && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Landing Page</h3>
                {marketingStrategy.landingPage.url && (
                  <p className="text-sm text-primary">{marketingStrategy.landingPage.url}</p>
                )}
                <p className="text-sm">{marketingStrategy.landingPage.description}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Section 5: Operations */}
      {enabledSections.includes('operations') && (() => {
        const ops = normalizeOperations(operations);
        const costSummary = computeOperationsCosts(ops);
        return (
          <>
            <SectionHeader number={getSectionNumber('operations')} title="Operations" id={`section-${getSectionNumber('operations')}`} />
            <div className="space-y-4 py-4">
              {ops.workforce.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Workforce</h3>
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-2 px-3 font-medium border-b">Role</th>
                        <th className="text-right py-2 px-3 font-medium border-b">Rate/Hour</th>
                        <th className="text-right py-2 px-3 font-medium border-b">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ops.workforce.map((m, i) => (
                        <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                          <td className="py-2 px-3 border-b font-medium">{m.role}</td>
                          <td className="py-2 px-3 border-b text-right tabular-nums">{formatCurrency(m.ratePerHour, currencyCode)}/hr</td>
                          <td className="py-2 px-3 border-b text-right tabular-nums">{m.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {ops.capacity.plannedOutputPerMonth > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Capacity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {ops.capacity.outputUnitLabel && (
                      <div className="border rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Output Unit</p>
                        <p className="text-lg font-bold">{ops.capacity.outputUnitLabel}</p>
                      </div>
                    )}
                    <div className="border rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">Planned/Month</p>
                      <p className="text-lg font-bold tabular-nums">{ops.capacity.plannedOutputPerMonth}</p>
                    </div>
                    {ops.capacity.maxOutputPerDay > 0 && (
                      <div className="border rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Max/Day</p>
                        <p className="text-lg font-bold tabular-nums">{ops.capacity.maxOutputPerDay}</p>
                      </div>
                    )}
                    {ops.capacity.maxOutputPerWeek > 0 && (
                      <div className="border rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Max/Week</p>
                        <p className="text-lg font-bold tabular-nums">{ops.capacity.maxOutputPerWeek}</p>
                      </div>
                    )}
                    {ops.capacity.maxOutputPerMonth > 0 && (
                      <div className="border rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Max/Month</p>
                        <p className="text-lg font-bold tabular-nums">{ops.capacity.maxOutputPerMonth}</p>
                      </div>
                    )}
                    {ops.capacity.utilizationRate > 0 && (
                      <div className="border rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Utilization Rate</p>
                        <p className="text-lg font-bold tabular-nums">{ops.capacity.utilizationRate}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {costSummary.monthlyOperationsTotal > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cost Summary</h3>
                  <div className="stat-grid">
                    <StatCard label="Variable Costs/mo" value={formatCurrency(costSummary.variableMonthlyTotal, currencyCode)} />
                    <StatCard label="Fixed Costs/mo" value={formatCurrency(costSummary.fixedMonthlyTotal, currencyCode)} />
                    <StatCard label="Workforce/mo" value={formatCurrency(costSummary.workforceMonthlyTotal, currencyCode)} />
                    <StatCard label="Total Operations/mo" value={formatCurrency(costSummary.monthlyOperationsTotal, currencyCode)} />
                  </div>
                </div>
              )}

              {ops.costItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cost Items</h3>
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-2 px-3 font-medium border-b">Category</th>
                        <th className="text-left py-2 px-3 font-medium border-b">Type</th>
                        <th className="text-right py-2 px-3 font-medium border-b">Rate</th>
                        <th className="text-left py-2 px-3 font-medium border-b">Driver</th>
                        <th className="text-right py-2 px-3 font-medium border-b">Monthly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ops.costItems.map((item, i) => {
                        const monthly = item.rate * item.driverQuantityPerMonth;
                        return (
                          <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                            <td className="py-2 px-3 border-b font-medium">{item.category}</td>
                            <td className="py-2 px-3 border-b capitalize">{item.type}</td>
                            <td className="py-2 px-3 border-b text-right tabular-nums">{formatCurrency(item.rate, currencyCode)}</td>
                            <td className="py-2 px-3 border-b">{item.driverType}</td>
                            <td className="py-2 px-3 border-b text-right tabular-nums">{formatCurrency(monthly, currencyCode)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {ops.operationalMetrics.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Operational Metrics</h3>
                  <div className="stat-grid">
                    {ops.operationalMetrics.map((m, i) => (
                      <StatCard
                        key={i}
                        label={m.name}
                        value={`${m.value} ${m.unit}${m.target > 0 ? ` (target: ${m.target} ${m.unit})` : ''}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {ops.equipment.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Equipment</h3>
                  <ul className="list-disc list-inside text-sm space-y-0.5">
                    {ops.equipment.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {ops.safetyProtocols.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Safety Protocols</h3>
                  <ol className="list-decimal list-inside text-sm space-y-0.5">
                    {ops.safetyProtocols.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* Section 6: Financial Projections */}
      {enabledSections.includes('financial-projections') && (
        <>
          <SectionHeader number={getSectionNumber('financial-projections')} title="Financial Projections" id={`section-${getSectionNumber('financial-projections')}`} />
          <div className="space-y-6 py-4">
            {/* Scenario KPI cards using StatCard pattern */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key Metrics (Scenario: {scenarioName})</h3>
              <div className="stat-grid">
                {primaryKpis.map((v) => (
                  <StatCard
                    key={v.id}
                    label={v.label}
                    value={formatKpiValue(v)}
                  />
                ))}
              </div>
            </div>

            {/* Scenario Parameters (dynamic from variable definitions) */}
            {definitions && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Scenario Parameters</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {Object.values(definitions)
                    .filter((v) => v.type === 'input')
                    .map((v) => (
                      <div key={v.id} className="flex justify-between border-b py-1">
                        <span className="text-muted-foreground">{v.label}</span>
                        <span className="font-medium tabular-nums">
                          {v.unit === 'currency'
                            ? formatCurrency(evaluated[v.id] ?? 0, currencyCode)
                            : v.unit === 'percent'
                              ? `${((evaluated[v.id] ?? 0) * 100).toFixed(0)}%`
                              : String(evaluated[v.id] ?? 0)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Unit Economics */}
            {(financials.unitEconomics.avgCheck > 0 || financials.unitEconomics.costPerEvent > 0) && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Unit Economics</h3>
                <div className="stat-grid">
                  <StatCard label="Avg Check" value={formatCurrency(financials.unitEconomics.avgCheck, currencyCode)} />
                  <StatCard label="Cost/Event" value={formatCurrency(financials.unitEconomics.costPerEvent, currencyCode)} />
                  <StatCard label="Profit/Event" value={formatCurrency(financials.unitEconomics.profitPerEvent, currencyCode)} />
                  <StatCard label="Break-Even" value={`${financials.unitEconomics.breakEvenEvents} events`} />
                </div>
              </div>
            )}

            {/* Dynamic Financial Chart */}
            {chartVariables.length > 0 && (
              <div className="card-elevated rounded-lg p-4" ref={chartContainerRef}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  12-Month Financial Projection
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dynamicChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v: number) => formatCurrency(v, currencyCode)} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value), currencyCode)} labelStyle={{ fontWeight: 600 }} />
                      <Legend />
                      {chartVariables.map((v) => (
                        <Area
                          key={v.id}
                          type="monotone"
                          dataKey={v.label}
                          stroke={getSemanticColor(v.label)}
                          fill={getSemanticColor(v.label)}
                          fillOpacity={0.15}
                          strokeWidth={2}
                          isAnimationActive={!chartAnimationDisabled}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Monthly P&L Table */}
            {financials.months.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">12-Month P&L</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-2 px-2 font-medium border-b">Month</th>
                        <th className="text-right py-2 px-2 font-medium border-b">Revenue</th>
                        <th className="text-right py-2 px-2 font-medium border-b">Costs</th>
                        <th className="text-right py-2 px-2 font-medium border-b">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financials.months.map((m, i) => {
                        const totalCosts = m.costs.marketing + m.costs.labor + m.costs.supplies + m.costs.museum + m.costs.transport;
                        const profit = m.revenue - totalCosts;
                        return (
                          <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                            <td className="py-1.5 px-2 border-b font-medium">{m.month}</td>
                            <td className="py-1.5 px-2 border-b text-right tabular-nums">{formatCurrency(m.revenue, currencyCode)}</td>
                            <td className="py-1.5 px-2 border-b text-right tabular-nums">{formatCurrency(totalCosts, currencyCode)}</td>
                            <td className={`py-1.5 px-2 border-b text-right font-semibold tabular-nums ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {formatCurrency(profit, currencyCode)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Section 7: Risks & Due Diligence */}
      {enabledSections.includes('risks-due-diligence') && (
        <>
          <SectionHeader number={getSectionNumber('risks-due-diligence')} title="Risks & Due Diligence" id={`section-${getSectionNumber('risks-due-diligence')}`} />
          <div className="space-y-4 py-4">
            {/* Investment Verdict Banner */}
            {risks.investmentVerdict && (
              <div className={`border-l-4 rounded-lg p-4 ${verdictBorderColors[risks.investmentVerdict.verdict]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold">Investment Verdict:</h3>
                  <span className="font-bold text-sm">{verdictLabels[risks.investmentVerdict.verdict]}</span>
                </div>
                {risks.investmentVerdict.conditions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Conditions</p>
                    <ol className="list-decimal list-inside text-xs space-y-0.5">
                      {risks.investmentVerdict.conditions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Risk Assessment */}
            {risks.risks.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Risk Assessment</h3>
                {risks.risks.map((risk, i) => (
                  <div key={i} className={`border rounded-lg p-4 ${risk.severity === 'critical' ? 'border-l-4 border-l-red-500' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${severityStyles[risk.severity]}`}>
                        {risk.severity}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{risk.category}</span>
                    </div>
                    <h4 className="font-semibold text-sm">{risk.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
                    <p className="text-xs mt-1"><span className="font-medium">Mitigation:</span> {risk.mitigation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPlaceholder section="Risks" />
            )}

            {/* Due Diligence Checklist */}
            {risks.dueDiligenceChecklist && risks.dueDiligenceChecklist.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Due Diligence Checklist</h3>
                <div className="space-y-2">
                  {risks.dueDiligenceChecklist.map((item, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[item.priority]}`}>
                          {item.priority}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${complianceStatusStyles[item.status]}`}>
                          {item.status === 'not-started' ? 'Not Started' : item.status === 'pending' ? 'Pending' : 'Complete'}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm">{item.item}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Checklist */}
            {risks.complianceChecklist.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Compliance Checklist</h3>
                <div className="space-y-1">
                  {risks.complianceChecklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${complianceStatusStyles[item.status]}`}>
                        {item.status === 'not-started' ? 'Not Started' : item.status === 'pending' ? 'Pending' : 'Complete'}
                      </span>
                      <span className="text-sm">{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Section 8: KPIs & Metrics */}
      {enabledSections.includes('kpis-metrics') && (
        <>
          <SectionHeader number={getSectionNumber('kpis-metrics')} title="KPIs & Metrics" id={`section-${getSectionNumber('kpis-metrics')}`} />
          <div className="space-y-4 py-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Target Metrics</h3>
            <div className="stat-grid">
              <StatCard label="Monthly Leads" value={String(kpis.targets.monthlyLeads)} />
              <StatCard label="Conversion Rate" value={`${(kpis.targets.conversionRate * 100).toFixed(0)}%`} />
              <StatCard label="Average Check" value={formatCurrency(kpis.targets.avgCheck, currencyCode)} />
              <StatCard label="CAC/Lead" value={formatCurrency(kpis.targets.cacPerLead, currencyCode)} />
              <StatCard label="CAC/Booking" value={formatCurrency(kpis.targets.cacPerBooking, currencyCode)} />
              <StatCard label="Monthly Bookings" value={String(kpis.targets.monthlyBookings)} />
            </div>
          </div>
        </>
      )}

      {/* Section 9: Launch Plan */}
      {enabledSections.includes('launch-plan') && (
        <>
          <SectionHeader number={getSectionNumber('launch-plan')} title="Launch Plan" id={`section-${getSectionNumber('launch-plan')}`} />
          <div className="space-y-4 py-4">
            {launchPlan.stages.length > 0 ? (
              <div className="relative">
                {launchPlan.stages.length > 1 && (
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
                )}
                <div className="space-y-4">
                  {launchPlan.stages.map((stage, i) => (
                    <div key={i} className="relative pl-10">
                      <div className="absolute left-1.5 top-1 size-3 rounded-full border-2 border-primary bg-background" />
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{stage.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {stage.startDate} -- {stage.endDate}
                          </span>
                        </div>
                        <div className="space-y-1 mt-2">
                          {stage.tasks.map((t, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${taskStatusStyles[t.status]}`}>
                                {taskStatusLabels[t.status]}
                              </span>
                              <span className="text-xs">{t.task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyPlaceholder section="Launch Plan" />
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t mt-10 pt-6">
        <p className="text-xs text-muted-foreground text-center">
          {business?.profile.name || 'Business Plan'} | Generated on {currentDate} | Scenario: {scenarioName}
        </p>
      </div>
    </div>
  );
}
