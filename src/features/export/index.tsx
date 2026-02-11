import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { scenarioNameAtom } from '@/store/scenario-atoms';
import {
  monthlyRevenueAtom,
  monthlyProfitAtom,
  profitMarginAtom,
  monthlyBookingsAtom,
  annualRevenueAtom,
} from '@/store/derived-atoms';
import { useSection } from '@/hooks/use-section';
import { DEFAULT_PACKAGES, DEFAULT_MARKETING_CHANNELS, DEFAULT_KPI_TARGETS } from '@/lib/constants';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  MonthlyProjection,
} from '@/types';

// Default data (same defaults as business-plan-view and individual section pages)
const defaultExecutiveSummary: ExecutiveSummary = {
  summary: 'Fun Box is a premium mobile kids birthday party service operating in the Miami metropolitan area.',
  mission: 'To create unforgettable, hassle-free birthday celebrations.',
  vision: "To become Miami's leading premium kids birthday party service.",
  keyHighlights: ['Three packages: $800 / $980 / $1,200'],
};

const defaultMarketAnalysis: MarketAnalysis = {
  targetDemographic: { ageRange: '28-50', location: 'Miami Metro', radius: 25 },
  marketSize: 'Miami-Dade County -- 2.7M population.',
  competitors: [],
  demographics: { population: 2700000, languages: ['English', 'Spanish'], income: 'Median household $55,000' },
};

const defaultProductService: ProductService = {
  packages: DEFAULT_PACKAGES,
  addOns: [{ name: 'Extra 30 minutes', price: 150 }],
};

const defaultMarketing: MarketingStrategy = {
  channels: DEFAULT_MARKETING_CHANNELS,
  offers: [],
  landingPage: { url: '', description: '' },
};

const defaultOperations: Operations = {
  crew: [{ role: 'Party Host', hourlyRate: 20, count: 1 }],
  capacity: { maxBookingsPerDay: 2, maxBookingsPerWeek: 8, maxBookingsPerMonth: 25 },
  travelRadius: 25,
  equipment: [],
  safetyProtocols: [],
};

function generateDefaultMonths(): MonthlyProjection[] {
  const monthNames = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027'];
  const bookingsPerMonth = [10, 12, 18, 22, 25, 25, 25, 25, 22, 28, 20, 25];
  const avgCheck = 993;
  return monthNames.map((month, i) => {
    const bookings = bookingsPerMonth[i];
    const revenue = bookings * avgCheck;
    const marketing = 2200;
    const labor = 3 * 20 * 4 * bookings;
    const supplies = 50 * bookings;
    const museum = 200 * bookings;
    const transport = 150 * bookings;
    return { month, revenue, costs: { marketing, labor, supplies, museum, transport }, profit: revenue - (marketing + labor + supplies + museum + transport) };
  });
}

const defaultFinancials: FinancialProjections = {
  months: generateDefaultMonths(),
  unitEconomics: { avgCheck: 993, costPerEvent: 450, profitPerEvent: 543, breakEvenEvents: 5 },
};

const defaultRisks: RisksDueDiligence = {
  risks: [],
  complianceChecklist: [],
};

const defaultKpis: KpisMetrics = { targets: DEFAULT_KPI_TARGETS };

const defaultLaunchPlan: LaunchPlan = { stages: [] };

export function Export() {
  const scenarioName = useAtomValue(scenarioNameAtom);
  const monthlyRevenue = useAtomValue(monthlyRevenueAtom);
  const monthlyProfit = useAtomValue(monthlyProfitAtom);
  const profitMargin = useAtomValue(profitMarginAtom);
  const monthlyBookings = useAtomValue(monthlyBookingsAtom);
  const annualRevenue = useAtomValue(annualRevenueAtom);

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
        scenarioMetrics: {
          monthlyRevenue,
          monthlyProfit,
          profitMargin,
          monthlyBookings,
          annualRevenue,
        },
        scenarioName,
        chartImage,
      });

      // 4. Trigger download
      saveAs(blob, 'fun-box-business-plan.pdf');
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Export Business Plan</h1>

      <Tabs defaultValue="business-plan">
        <TabsList>
          <TabsTrigger value="business-plan">
            <FileText className="size-4 mr-1.5" />
            Business Plan
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="size-4 mr-1.5" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-plan">
          <BusinessPlanView chartAnimationDisabled={false} chartContainerRef={chartRef} />
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Download your business plan as a professionally formatted PDF document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Active Scenario</p>
                  <p className="text-xs text-muted-foreground">
                    Metrics from this scenario will be included in the export.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800">
                  {scenarioName}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
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
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                The PDF includes all 9 sections, financial charts, and scenario metrics.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
