import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { scenarioNameAtom } from '@/store/scenario-atoms';
import { evaluatedValuesAtom } from '@/store/derived-atoms';
import { activeBusinessAtom, businessVariablesAtom } from '@/store/business-atoms';
import { SECTION_SLUGS } from '@/lib/constants';
import { useSection } from '@/hooks/use-section';
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
} from '@/types';

// Default data (same defaults as business-plan-view and individual section pages)
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

const defaultFinancials: FinancialProjections = {
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

export function Export() {
  const scenarioName = useAtomValue(scenarioNameAtom);
  const evaluated = useAtomValue(evaluatedValuesAtom);
  const business = useAtomValue(activeBusinessAtom);
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
