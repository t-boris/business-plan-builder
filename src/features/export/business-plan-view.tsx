import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useSection } from '@/hooks/use-section';
import { SECTION_SLUGS, SECTION_LABELS } from '@/lib/constants';
import { scenarioNameAtom } from '@/store/scenario-atoms';
import { evaluatedValuesAtom } from '@/store/derived-atoms';
import { activeBusinessAtom, businessVariablesAtom } from '@/store/business-atoms';
import type {
  ExecutiveSummary,
  MarketAnalysis,
  ProductService,
  MarketingStrategy,
  Operations,
  FinancialProjections as FinancialProjectionsType,
  RisksDueDiligence,
  KpisMetrics,
  LaunchPlan,
  MarketingChannelName,
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

// ---- Default data (same as individual section pages) ----

const defaultExecutiveSummary: ExecutiveSummary = {
  summary: '',
  mission: '',
  vision: '',
  keyHighlights: [],
};

const defaultMarketAnalysis: MarketAnalysis = {
  targetDemographic: { ageRange: '', location: '', radius: 0, zipCodes: [] },
  marketSize: '',
  tamDollars: 0,
  targetMarketShare: '',
  competitors: [],
  demographics: { population: 0, languages: [], income: '', householdsWithKids: 0, annualTourists: 0 },
};

const defaultProductService: ProductService = {
  packages: [],
  addOns: [],
};

const CHANNEL_DISPLAY_NAMES: Record<MarketingChannelName, string> = {
  'meta-ads': 'Meta Ads',
  'google-ads': 'Google Ads',
  'organic-social': 'Organic Social',
  partnerships: 'Partnerships',
};

const defaultMarketing: MarketingStrategy = {
  channels: [],
  offers: [],
  landingPage: { url: '', description: '' },
};

const defaultOperations: Operations = {
  crew: [],
  hoursPerEvent: 0,
  capacity: { maxBookingsPerDay: 0, maxBookingsPerWeek: 0, maxBookingsPerMonth: 0 },
  travelRadius: 0,
  equipment: [],
  safetyProtocols: [],
  costBreakdown: {
    suppliesPerChild: 0, participantsPerEvent: 0, museumTicketPrice: 0, ticketsPerEvent: 0,
    fuelPricePerGallon: 0, vehicleMPG: 0, avgRoundTripMiles: 0, parkingPerEvent: 0,
    ownerSalary: 0, marketingPerson: 0, eventCoordinator: 0,
    vehiclePayment: 0, vehicleInsurance: 0, vehicleMaintenance: 0,
    crmSoftware: 0, websiteHosting: 0, aiChatbot: 0, cloudServices: 0, phonePlan: 0,
    contentCreation: 0, graphicDesign: 0,
    storageRent: 0, equipmentAmortization: 0, businessLicenses: 0, miscFixed: 0,
    customExpenses: [],
  },
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
  if (/revenue|income|sales/.test(lower)) return '#22c55e';
  if (/cost|expense|spend/.test(lower)) return '#f97316';
  if (/profit|net|margin/.test(lower)) return '#3b82f6';
  return '#64748b';
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
    <h2 id={id} className="text-xl font-bold tracking-tight border-b pb-2 pt-6 scroll-mt-6">
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

// ---- Main Component ----

export interface BusinessPlanViewProps {
  /** If true, chart will not animate (for PDF capture) */
  chartAnimationDisabled?: boolean;
  /** Ref to attach to the chart container for PDF capture */
  chartContainerRef?: React.RefObject<HTMLDivElement | null>;
}

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

  if (isLoading) {
    return (
      <div className="max-w-[800px] mx-auto py-8 px-4">
        <p className="text-muted-foreground">Loading business plan...</p>
      </div>
    );
  }

  // Dynamic KPI cards from evaluated variables (sorted by unit priority)
  const unitPriority: Record<import('@/types').VariableUnit, number> = {
    currency: 0, percent: 1, ratio: 2, count: 3, months: 4, days: 5, hours: 6,
  };

  const computedVariables = useMemo(() => {
    if (!definitions) return [];
    return Object.values(definitions)
      .filter((v) => v.type === 'computed')
      .sort((a, b) => (unitPriority[a.unit] ?? 99) - (unitPriority[b.unit] ?? 99));
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

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dynamicChartData = useMemo(() => {
    return MONTHS.map((month) => {
      const point: Record<string, string | number> = { month };
      chartVariables.forEach((v) => {
        point[v.label] = evaluated[v.id] ?? 0;
      });
      return point;
    });
  }, [chartVariables, evaluated]);

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-[800px] mx-auto py-8 px-4 prose prose-sm max-w-none">
      {/* Header */}
      <div className="text-center pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {business?.profile.name || 'Business Plan'}
        </h1>
        <p className="text-sm text-muted-foreground">Business Plan</p>
        <p className="text-muted-foreground text-sm">{currentDate}</p>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800 mt-2">
          Scenario: {scenarioName}
        </span>
      </div>

      {/* Table of Contents */}
      <div className="py-6 border-b">
        <h2 className="text-lg font-semibold mb-3">Table of Contents</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          {enabledSections.map((slug, i) => (
            <li key={slug}>
              <a href={`#section-${i + 1}`} className="text-blue-600 hover:underline">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Target Demographic</h3>
                <p className="text-sm">Age: {marketAnalysis.targetDemographic.ageRange}</p>
                <p className="text-sm">Location: {marketAnalysis.targetDemographic.location} ({marketAnalysis.targetDemographic.radius} mile radius)</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Market Size</h3>
                <p className="text-sm leading-relaxed">{marketAnalysis.marketSize}</p>
                {(marketAnalysis.tamDollars > 0 || marketAnalysis.targetMarketShare) && (
                  <div className="flex gap-4 mt-2">
                    {marketAnalysis.tamDollars > 0 && (
                      <p className="text-sm"><span className="font-medium">TAM:</span> ${marketAnalysis.tamDollars.toLocaleString()}</p>
                    )}
                    {marketAnalysis.targetMarketShare && (
                      <p className="text-sm"><span className="font-medium">Target Share:</span> {marketAnalysis.targetMarketShare}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {marketAnalysis.competitors.length > 0 && (
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

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Demographics</h3>
              <p className="text-sm">Population: {marketAnalysis.demographics.population.toLocaleString()}</p>
              {marketAnalysis.demographics.householdsWithKids > 0 && (
                <p className="text-sm">Households with Kids: {marketAnalysis.demographics.householdsWithKids.toLocaleString()}</p>
              )}
              {marketAnalysis.demographics.annualTourists > 0 && (
                <p className="text-sm">Annual Tourists: {marketAnalysis.demographics.annualTourists.toLocaleString()}</p>
              )}
              <p className="text-sm">Languages: {marketAnalysis.demographics.languages.join(', ')}</p>
              <p className="text-sm">Income: {marketAnalysis.demographics.income}</p>
            </div>
          </div>
        </>
      )}

      {/* Section 3: Product & Service */}
      {enabledSections.includes('product-service') && (
        <>
          <SectionHeader number={getSectionNumber('product-service')} title="Product & Service" id={`section-${getSectionNumber('product-service')}`} />
          <div className="space-y-4 py-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Packages</h3>
            <div className="grid grid-cols-3 gap-4">
              {productService.packages.map((pkg, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm">{pkg.name}</h4>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(pkg.price, currencyCode)}</p>
                  <p className="text-xs text-muted-foreground">{pkg.duration} | Up to {pkg.maxParticipants} guests</p>
                  <p className="text-xs mt-2">{pkg.description}</p>
                  <ul className="text-xs mt-2 space-y-0.5">
                    {pkg.includes.map((item, j) => (
                      <li key={j} className="flex items-start gap-1">
                        <span className="text-green-600 mt-0.5">*</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {productService.addOns.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Add-Ons</h3>
                <ul className="text-sm space-y-0.5">
                  {productService.addOns.map((a, i) => (
                    <li key={i}>{a.name} — {formatCurrency(a.price, currencyCode)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Section 4: Marketing Strategy */}
      {enabledSections.includes('marketing-strategy') && (
        <>
          <SectionHeader number={getSectionNumber('marketing-strategy')} title="Marketing Strategy" id={`section-${getSectionNumber('marketing-strategy')}`} />
          <div className="space-y-4 py-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Channels</h3>
            <div className="grid grid-cols-2 gap-4">
              {marketingStrategy.channels.map((ch, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm">{CHANNEL_DISPLAY_NAMES[ch.name] || ch.name}</h4>
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
                  <p className="text-sm text-blue-600">{marketingStrategy.landingPage.url}</p>
                )}
                <p className="text-sm">{marketingStrategy.landingPage.description}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Section 5: Operations */}
      {enabledSections.includes('operations') && (
        <>
          <SectionHeader number={getSectionNumber('operations')} title="Operations" id={`section-${getSectionNumber('operations')}`} />
          <div className="space-y-4 py-4">
            {operations.crew.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Crew</h3>
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-2 px-3 font-medium border-b">Role</th>
                      <th className="text-right py-2 px-3 font-medium border-b">Hourly Rate</th>
                      <th className="text-right py-2 px-3 font-medium border-b">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.crew.map((m, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                        <td className="py-2 px-3 border-b font-medium">{m.role}</td>
                        <td className="py-2 px-3 border-b text-right">${m.hourlyRate}/hr</td>
                        <td className="py-2 px-3 border-b text-right">{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Daily Capacity</p>
                <p className="text-lg font-bold">{operations.capacity.maxBookingsPerDay}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Weekly Capacity</p>
                <p className="text-lg font-bold">{operations.capacity.maxBookingsPerWeek}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Monthly Capacity</p>
                <p className="text-lg font-bold">{operations.capacity.maxBookingsPerMonth}</p>
              </div>
            </div>

            {operations.equipment.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Equipment</h3>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {operations.equipment.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {operations.safetyProtocols.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Safety Protocols</h3>
                <ol className="list-decimal list-inside text-sm space-y-0.5">
                  {operations.safetyProtocols.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </>
      )}

      {/* Section 6: Financial Projections */}
      {enabledSections.includes('financial-projections') && (
        <>
          <SectionHeader number={getSectionNumber('financial-projections')} title="Financial Projections" id={`section-${getSectionNumber('financial-projections')}`} />
          <div className="space-y-4 py-4">
            {/* Scenario KPI cards */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Metrics (Scenario: {scenarioName})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {primaryKpis.map((v) => (
                  <div key={v.id} className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{v.label}</p>
                    <p className="text-lg font-bold">
                      {v.unit === 'currency'
                        ? formatCurrency(evaluated[v.id] ?? 0, currencyCode)
                        : v.unit === 'percent'
                          ? `${((evaluated[v.id] ?? 0) * 100).toFixed(1)}%`
                          : String(Math.round(evaluated[v.id] ?? 0))}
                    </p>
                  </div>
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
                        <span className="font-medium">
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
                <div className="grid grid-cols-4 gap-3">
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Avg Check</p>
                    <p className="text-sm font-bold">{formatCurrency(financials.unitEconomics.avgCheck, currencyCode)}</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Cost/Event</p>
                    <p className="text-sm font-bold">{formatCurrency(financials.unitEconomics.costPerEvent, currencyCode)}</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Profit/Event</p>
                    <p className="text-sm font-bold">{formatCurrency(financials.unitEconomics.profitPerEvent, currencyCode)}</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Break-Even</p>
                    <p className="text-sm font-bold">{financials.unitEconomics.breakEvenEvents} events</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Financial Chart */}
            {chartVariables.length > 0 && (
              <div ref={chartContainerRef}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
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
                            <td className="py-1.5 px-2 border-b text-right">{formatCurrency(m.revenue, currencyCode)}</td>
                            <td className="py-1.5 px-2 border-b text-right">{formatCurrency(totalCosts, currencyCode)}</td>
                            <td className={`py-1.5 px-2 border-b text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Monthly Leads</p>
                <p className="text-lg font-bold">{kpis.targets.monthlyLeads}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
                <p className="text-lg font-bold">{(kpis.targets.conversionRate * 100).toFixed(0)}%</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Average Check</p>
                <p className="text-lg font-bold">{formatCurrency(kpis.targets.avgCheck, currencyCode)}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">CAC/Lead</p>
                <p className="text-lg font-bold">{formatCurrency(kpis.targets.cacPerLead, currencyCode)}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">CAC/Booking</p>
                <p className="text-lg font-bold">{formatCurrency(kpis.targets.cacPerBooking, currencyCode)}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Monthly Bookings</p>
                <p className="text-lg font-bold">{kpis.targets.monthlyBookings}</p>
              </div>
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
                  <div className="absolute left-1.5 top-1 size-3 rounded-full border-2 border-blue-500 bg-background" />
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{stage.name}</h4>
                      <span className="text-xs text-muted-foreground">
                        {stage.startDate} — {stage.endDate}
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
      <div className="text-center pt-8 border-t mt-8">
        <p className="text-xs text-muted-foreground">
          {business?.profile.name || 'Business Plan'} | Generated on {currentDate} | Scenario: {scenarioName}
        </p>
      </div>
    </div>
  );
}
