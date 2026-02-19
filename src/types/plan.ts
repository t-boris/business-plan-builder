// Business Plan Section Types
// All interfaces are serializable (no methods) for Firestore compatibility.
// Max 2 levels of nesting for Firestore document structure.

// --- Section 1: Executive Summary ---

export interface ExecutiveSummary {
  summary: string;
  mission: string;
  vision: string;
  keyHighlights: string[];
}

// --- Section 2: Market Analysis ---

export interface Competitor {
  name: string;
  pricing: string;
  strengths: string;
  weaknesses: string;
}

// A single step in a TAM/SAM/SOM calculation
export interface CalcStep {
  label: string;       // e.g. "Total global SaaS market", "SMB segment"
  value: number;       // e.g. 50000000000, 15, 500000
  type: 'currency' | 'percentage' | 'count';
}

// TAM supports approach selection (top-down, bottom-up, custom)
export type SizingApproach = 'top-down' | 'bottom-up' | 'custom';

export interface TamConfig {
  approach: SizingApproach;
  steps: CalcStep[];
}

// SAM = TAM * filter steps
export interface SamConfig {
  steps: CalcStep[];
}

// SOM = SAM * capture steps
export interface SomConfig {
  steps: CalcStep[];
}

export interface MarketSizing {
  tam: TamConfig;
  sam: SamConfig;
  som: SomConfig;
}

export interface FunnelStage {
  label: string;
  description: string;
  volume: number;
  conversionRate: number; // 0-100 percent to next stage
}

export interface AdoptionModel {
  type: 'linear' | 's-curve';
  totalMarket: number;
  initialUsers: number;
  growthRate: number;
  projectionMonths: number;
}

export interface CustomMetric {
  label: string;
  value: string;
  source: string;
}

export interface MarketAnalysisBlocks {
  sizing: boolean;
  competitors: boolean;
  demographics: boolean;
  acquisitionFunnel: boolean;
  adoptionModel: boolean;
  customMetrics: boolean;
}

export interface MarketAnalysis {
  enabledBlocks: MarketAnalysisBlocks;

  // TAM / SAM / SOM (step-based computed)
  marketSizing: MarketSizing;
  marketNarrative: string;

  // Competitors
  competitors: Competitor[];

  // Demographics — generic, no hardcoded fields
  demographics: {
    population: number;
    income: string;
    metrics: CustomMetric[];
  };

  // Acquisition funnel
  acquisitionFunnel: FunnelStage[];

  // Adoption simulation
  adoptionModel: AdoptionModel;

  // User-defined custom metrics
  customMetrics: CustomMetric[];
}

// --- Section 3: Product/Service ---

export interface OfferingImage {
  url: string;
  storagePath?: string;
  alt?: string;
}

export interface Offering {
  id: string;
  name: string;
  description: string;
  price: number | null;       // null = "on request"
  priceLabel?: string;         // e.g. "per hour", "per month", "from"
  addOnIds: string[];          // references to AddOn.id
  image?: OfferingImage;
}

export interface AddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  priceLabel?: string;         // e.g. "per unit", "one-time"
}

export interface ProductService {
  overview?: string;
  offerings: Offering[];
  addOns: AddOn[];
}

// --- Section 4: Marketing Strategy ---

export interface MarketingChannel {
  name: string;
  budget: number;
  expectedLeads: number;
  expectedCAC: number;
  description: string;
  tactics: string[];
  url?: string;
}

export interface MarketingStrategy {
  channels: MarketingChannel[];
  offers: string[];
  landingPage: {
    url: string;
    description: string;
  };
}

// --- Section 5: Operations ---

export interface WorkforceMember {
  role: string;
  count: number;
  ratePerHour: number;
  hoursPerWeek: number;
}

export interface CapacityItem {
  id: string;
  name: string;               // e.g. "Standard Package", "Custom Batch", "On-site Service"
  offeringId?: string;        // optional reference to ProductService.offering.id
  outputUnitLabel: string;
  plannedOutputPerMonth: number;
  maxOutputPerDay: number;
  maxOutputPerWeek: number;
  maxOutputPerMonth: number;
  utilizationRate: number;   // 0-100 percentage
}

export type VariableComponentSourcing =
  | 'in-house'
  | 'purchase-order'
  | 'on-demand';

export interface VariableCostComponent {
  id: string;
  name: string;                    // e.g. "Aluminum sheet", "Cloud API call", "Subcontracted assembly"
  offeringId?: string;             // optional link to ProductService.offering.id
  description?: string;
  supplier?: string;
  sourcingModel: VariableComponentSourcing;
  componentUnitLabel: string;      // kg, part, minute, API call, etc.
  costPerComponentUnit: number;    // cost for one component unit
  componentUnitsPerOutput: number; // how many component units are needed per one output unit
  orderQuantity: number;           // batch/MOQ per order (used for purchase-order sourcing)
  orderFee: number;                // extra cost per order (shipping, handling, customs, etc.)
}

export type CostDriverType =
  | 'per-unit'
  | 'per-order'
  | 'per-service-hour'
  | 'per-machine-hour'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface CostItem {
  category: string;
  type: 'variable' | 'fixed';
  rate: number;
  driverType: CostDriverType;
  driverQuantityPerMonth: number;
}

export interface OperationalMetric {
  name: string;
  unit: string;
  value: number;
  target: number;
}

export interface Operations {
  workforce: WorkforceMember[];
  capacityItems: CapacityItem[];
  variableComponents: VariableCostComponent[];
  costItems: CostItem[];
  equipment: string[];
  safetyProtocols: string[];
  operationalMetrics: OperationalMetric[];
}

// --- Section 6: Financial Projections ---

export interface MonthlyCosts {
  marketing: number;
  labor: number;
  supplies: number;
  museum: number;
  transport: number;
  fixed: number;
}

export interface MonthlyProjection {
  month: string;
  revenue: number;
  costs: MonthlyCosts;
  profit: number;
  nonOperatingCashFlow?: number; // financing/investing cash flow not included in revenue
}

export interface UnitEconomics {
  pricePerUnit: number;
  variableCostPerUnit: number;
  profitPerUnit: number;
  breakEvenUnits: number;
}

export interface FinancialProjections {
  startingCash: number; // opening cash balance before Month 1
  months: MonthlyProjection[];
  unitEconomics: UnitEconomics;
  seasonCoefficients: number[]; // 12 values, 1.0 = average month
}

// --- Section 7: Risks & Due Diligence ---

export type RiskCategory = 'regulatory' | 'operational' | 'financial' | 'legal' | 'safety' | 'dependency' | 'capacity' | 'market';
export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Risk {
  category: RiskCategory;
  title: string;
  description: string;
  severity: RiskSeverity;
  mitigation: string;
}

export type ComplianceStatus = 'complete' | 'pending' | 'not-started';

export interface ComplianceItem {
  item: string;
  status: ComplianceStatus;
}

export type DueDiligencePriority = 'required' | 'advised';

export interface DueDiligenceItem {
  item: string;
  detail: string;
  priority: DueDiligencePriority;
  status: ComplianceStatus;
}

export type InvestmentVerdict = 'strong-go' | 'conditional-go' | 'proceed-with-caution' | 'defer' | 'no-go';

export interface InvestmentVerdictSummary {
  verdict: InvestmentVerdict;
  conditions: string[];
}

export interface RisksDueDiligence {
  risks: Risk[];
  complianceChecklist: ComplianceItem[];
  investmentVerdict?: InvestmentVerdictSummary;
  dueDiligenceChecklist?: DueDiligenceItem[];
}

// --- Section 8: KPIs & Metrics ---

export interface KpiTargets {
  monthlyLeads: number;
  conversionRate: number;
  pricePerUnit: number;
  cacPerLead: number;
  cacPerBooking: number;
  monthlyBookings: number;
}

export interface KpisMetrics {
  targets: KpiTargets;
  actuals?: KpiTargets;
}

// --- Section 9: Launch Plan ---

export type TaskStatus = 'done' | 'in-progress' | 'pending';

export interface LaunchTask {
  task: string;
  status: TaskStatus;
}

export interface LaunchStage {
  name: string;
  startDate: string;
  endDate: string;
  tasks: LaunchTask[];
}

export interface LaunchPlan {
  stages: LaunchStage[];
}

// --- Section 10: Growth Timeline ---

export interface HireDelta {
  role: string;
  count: number;
  ratePerHour: number;
  hoursPerWeek: number;
}

export interface CostChangeDelta {
  category: string;
  costType: 'variable' | 'fixed';
  rate: number;
  driverType: CostDriverType;
  driverQuantityPerMonth: number;
}

export interface CapacityChangeDelta {
  capacityItemId?: string;            // specific item, or undefined = all items equally
  outputDelta: number;
}

export interface MarketingChangeDelta {
  monthlyBudget: number;
}

export interface CustomDelta {
  label: string;
  value: number;
  formula?: string;                   // math expression, e.g. "3000 * 1.2 + 500"
  target: 'revenue' | 'fixedCost' | 'variableCost' | 'marketing';
}

export interface FundingRoundDelta {
  amount: number;
  legalCosts: number;
  investmentType: 'equity' | 'debt' | 'grant';
}

export interface FacilityBuildDelta {
  constructionCost: number;
  monthlyRent: number;
  capacityAdded: number;
  capacityItemId?: string;
}

export interface HiringCampaignDelta {
  totalHires: number;
  role: string;
  ratePerHour: number;
  hoursPerWeek: number;
  recruitingCostPerHire: number;
}

export interface PriceChangeDelta {
  newPricePerUnit?: number;
  // Legacy field kept for backward compatibility with older saved events.
  newAvgCheck?: number;
}

export interface EquipmentPurchaseDelta {
  purchaseCost: number;
  capacityIncrease: number;
  maintenanceCostMonthly: number;
  capacityItemId?: string;
}

export interface SeasonalCampaignDelta {
  budgetIncrease: number;
}

export type GrowthEventType =
  | 'hire'
  | 'cost-change'
  | 'capacity-change'
  | 'marketing-change'
  | 'custom'
  | 'funding-round'
  | 'facility-build'
  | 'hiring-campaign'
  | 'price-change'
  | 'equipment-purchase'
  | 'seasonal-campaign';

export type GrowthEventDelta =
  | { type: 'hire'; data: HireDelta }
  | { type: 'cost-change'; data: CostChangeDelta }
  | { type: 'capacity-change'; data: CapacityChangeDelta }
  | { type: 'marketing-change'; data: MarketingChangeDelta }
  | { type: 'custom'; data: CustomDelta }
  | { type: 'funding-round'; data: FundingRoundDelta }
  | { type: 'facility-build'; data: FacilityBuildDelta }
  | { type: 'hiring-campaign'; data: HiringCampaignDelta }
  | { type: 'price-change'; data: PriceChangeDelta }
  | { type: 'equipment-purchase'; data: EquipmentPurchaseDelta }
  | { type: 'seasonal-campaign'; data: SeasonalCampaignDelta };

export interface GrowthEvent {
  id: string;
  month: number;
  label: string;
  delta: GrowthEventDelta;
  enabled: boolean;
  durationMonths?: number;
}

export interface GrowthTimeline {
  events: GrowthEvent[];
  autoSync: boolean;
}

// --- Union & Slug Types ---

export type BusinessPlanSection =
  | ExecutiveSummary
  | MarketAnalysis
  | ProductService
  | MarketingStrategy
  | Operations
  | FinancialProjections
  | RisksDueDiligence
  | KpisMetrics
  | LaunchPlan
  | GrowthTimeline;

export type SectionSlug =
  | 'executive-summary'
  | 'market-analysis'
  | 'product-service'
  | 'marketing-strategy'
  | 'operations'
  | 'financial-projections'
  | 'risks-due-diligence'
  | 'kpis-metrics'
  | 'launch-plan'
  | 'growth-timeline';

// --- Business Plan Metadata ---

export interface BusinessPlan {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
