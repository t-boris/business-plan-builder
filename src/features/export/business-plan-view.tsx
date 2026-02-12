import { useAtomValue } from 'jotai';
import { useSection } from '@/hooks/use-section';
import { SECTION_SLUGS, SECTION_LABELS } from '@/lib/constants';
import {
  scenarioNameAtom,
  snapshotScenarioAtom,
} from '@/store/scenario-atoms';
import {
  monthlyRevenueAtom,
  monthlyProfitAtom,
  profitMarginAtom,
  monthlyBookingsAtom,
  annualRevenueAtom,
} from '@/store/derived-atoms';
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
  MonthlyCosts,
  MarketingChannelName,
  RiskSeverity,
  ComplianceStatus,
  TaskStatus,
  InvestmentVerdict,
  DueDiligencePriority,
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function sumCosts(costs: MonthlyCosts): number {
  return costs.marketing + costs.labor + costs.supplies + costs.museum + costs.transport;
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
  // Scenario data
  const scenarioName = useAtomValue(scenarioNameAtom);
  const scenarioVars = useAtomValue(snapshotScenarioAtom);
  const monthlyRevenue = useAtomValue(monthlyRevenueAtom);
  const monthlyProfit = useAtomValue(monthlyProfitAtom);
  const profitMargin = useAtomValue(profitMarginAtom);
  const monthlyBookings = useAtomValue(monthlyBookingsAtom);
  const annualRevenue = useAtomValue(annualRevenueAtom);

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

  // Chart data
  const chartData = financials.months.map((m) => ({
    month: m.month,
    Revenue: m.revenue,
    'Total Costs': sumCosts(m.costs),
  }));

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-[800px] mx-auto py-8 px-4 prose prose-sm max-w-none">
      {/* Header */}
      <div className="text-center pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Business Plan</h1>
        <p className="text-muted-foreground text-sm">{currentDate}</p>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800 mt-2">
          Scenario: {scenarioName}
        </span>
      </div>

      {/* Table of Contents */}
      <div className="py-6 border-b">
        <h2 className="text-lg font-semibold mb-3">Table of Contents</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          {SECTION_SLUGS.map((slug, i) => (
            <li key={slug}>
              <a href={`#section-${i + 1}`} className="text-blue-600 hover:underline">
                {SECTION_LABELS[slug]}
              </a>
            </li>
          ))}
        </ol>
      </div>

      {/* Section 1: Executive Summary */}
      <SectionHeader number={1} title="Executive Summary" id="section-1" />
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

      {/* Section 2: Market Analysis */}
      <SectionHeader number={2} title="Market Analysis" id="section-2" />
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

      {/* Section 3: Product & Service */}
      <SectionHeader number={3} title="Product & Service" id="section-3" />
      <div className="space-y-4 py-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Packages</h3>
        <div className="grid grid-cols-3 gap-4">
          {productService.packages.map((pkg, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm">{pkg.name}</h4>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(pkg.price)}</p>
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
                <li key={i}>{a.name} — {formatCurrency(a.price)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Section 4: Marketing Strategy */}
      <SectionHeader number={4} title="Marketing Strategy" id="section-4" />
      <div className="space-y-4 py-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Channels</h3>
        <div className="grid grid-cols-2 gap-4">
          {marketingStrategy.channels.map((ch, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h4 className="font-semibold text-sm">{CHANNEL_DISPLAY_NAMES[ch.name] || ch.name}</h4>
              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                <span>Budget: {formatCurrency(ch.budget)}/mo</span>
                <span>Leads: {ch.expectedLeads}</span>
                <span>CAC: {formatCurrency(ch.expectedCAC)}</span>
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

      {/* Section 5: Operations */}
      <SectionHeader number={5} title="Operations" id="section-5" />
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

      {/* Section 6: Financial Projections */}
      <SectionHeader number={6} title="Financial Projections" id="section-6" />
      <div className="space-y-4 py-4">
        {/* Scenario KPI cards */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Metrics (Scenario: {scenarioName})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Monthly Revenue</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(monthlyRevenue)}</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Monthly Profit</p>
              <p className={`text-lg font-bold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(monthlyProfit)}</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Profit Margin</p>
              <p className={`text-lg font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(profitMargin * 100).toFixed(1)}%</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Monthly Bookings</p>
              <p className="text-lg font-bold">{monthlyBookings}</p>
            </div>
          </div>
        </div>

        {/* Scenario Parameters */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Scenario Parameters</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Price Tier 1</span><span className="font-medium">{formatCurrency(scenarioVars.priceTier1)}</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Price Tier 2</span><span className="font-medium">{formatCurrency(scenarioVars.priceTier2)}</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Price Tier 3</span><span className="font-medium">{formatCurrency(scenarioVars.priceTier3)}</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Monthly Leads</span><span className="font-medium">{scenarioVars.monthlyLeads}</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Conversion Rate</span><span className="font-medium">{(scenarioVars.conversionRate * 100).toFixed(0)}%</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">CAC/Lead</span><span className="font-medium">{formatCurrency(scenarioVars.cacPerLead)}</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Meta Ads</span><span className="font-medium">{formatCurrency(scenarioVars.monthlyAdBudgetMeta)}/mo</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Google Ads</span><span className="font-medium">{formatCurrency(scenarioVars.monthlyAdBudgetGoogle)}/mo</span></div>
            <div className="flex justify-between border-b py-1"><span className="text-muted-foreground">Staff Count</span><span className="font-medium">{scenarioVars.staffCount}</span></div>
          </div>
        </div>

        {/* Unit Economics */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Unit Economics</h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Avg Check</p>
              <p className="text-sm font-bold">{formatCurrency(financials.unitEconomics.avgCheck)}</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Cost/Event</p>
              <p className="text-sm font-bold">{formatCurrency(financials.unitEconomics.costPerEvent)}</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Profit/Event</p>
              <p className="text-sm font-bold">{formatCurrency(financials.unitEconomics.profitPerEvent)}</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Break-Even</p>
              <p className="text-sm font-bold">{financials.unitEconomics.breakEvenEvents} events</p>
            </div>
          </div>
        </div>

        {/* Revenue vs Costs Chart */}
        <div ref={chartContainerRef}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Revenue vs Costs (12-Month Projection)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  isAnimationActive={!chartAnimationDisabled}
                />
                <Area
                  type="monotone"
                  dataKey="Total Costs"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  isAnimationActive={!chartAnimationDisabled}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly P&L Table */}
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
                  const totalCosts = sumCosts(m.costs);
                  const profit = m.revenue - totalCosts;
                  return (
                    <tr key={i} className={i % 2 === 1 ? 'bg-muted/30' : ''}>
                      <td className="py-1.5 px-2 border-b font-medium">{m.month}</td>
                      <td className="py-1.5 px-2 border-b text-right">{formatCurrency(m.revenue)}</td>
                      <td className="py-1.5 px-2 border-b text-right">{formatCurrency(totalCosts)}</td>
                      <td className={`py-1.5 px-2 border-b text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 7: Risks & Due Diligence */}
      <SectionHeader number={7} title="Risks & Due Diligence" id="section-7" />
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

      {/* Section 8: KPIs & Metrics */}
      <SectionHeader number={8} title="KPIs & Metrics" id="section-8" />
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
            <p className="text-lg font-bold">{formatCurrency(kpis.targets.avgCheck)}</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">CAC/Lead</p>
            <p className="text-lg font-bold">{formatCurrency(kpis.targets.cacPerLead)}</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">CAC/Booking</p>
            <p className="text-lg font-bold">{formatCurrency(kpis.targets.cacPerBooking)}</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Monthly Bookings</p>
            <p className="text-lg font-bold">{kpis.targets.monthlyBookings}</p>
          </div>
        </div>
      </div>

      {/* Section 9: Launch Plan */}
      <SectionHeader number={9} title="Launch Plan" id="section-9" />
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

      {/* Footer */}
      <div className="text-center pt-8 border-t mt-8">
        <p className="text-xs text-muted-foreground">
          Business Plan | Generated on {currentDate} | Scenario: {scenarioName}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Annual Revenue Projection: {formatCurrency(annualRevenue)}
        </p>
      </div>
    </div>
  );
}
