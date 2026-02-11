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

export interface GeneratePdfParams {
  sections: {
    execSummary: ExecutiveSummary;
    marketAnalysis: MarketAnalysis;
    productService: ProductService;
    marketingStrategy: MarketingStrategy;
    operations: Operations;
    financials: FinancialProjections;
    risks: RisksDueDiligence;
    kpis: KpisMetrics;
    launchPlan: LaunchPlan;
  };
  scenarioMetrics: {
    monthlyRevenue: number;
    monthlyProfit: number;
    profitMargin: number;
    monthlyBookings: number;
    annualRevenue: number;
  };
  scenarioName: string;
  chartImage: string | null;
}

/**
 * Generate a business plan PDF blob. Uses dynamic import to lazy-load @react-pdf/renderer.
 */
export async function generateBusinessPlanPdf(params: GeneratePdfParams): Promise<Blob> {
  // Dynamic imports to keep @react-pdf/renderer out of the main bundle
  const [{ pdf }, { BusinessPlanDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./BusinessPlanDocument'),
  ]);

  const doc = BusinessPlanDocument({
    execSummary: params.sections.execSummary,
    marketAnalysis: params.sections.marketAnalysis,
    productService: params.sections.productService,
    marketingStrategy: params.sections.marketingStrategy,
    operations: params.sections.operations,
    financials: params.sections.financials,
    risks: params.sections.risks,
    kpis: params.sections.kpis,
    launchPlan: params.sections.launchPlan,
    scenarioName: params.scenarioName,
    scenarioMetrics: params.scenarioMetrics,
    chartImage: params.chartImage,
  });

  const blob = await pdf(doc).toBlob();
  return blob;
}
