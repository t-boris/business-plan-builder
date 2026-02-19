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

export type MarketingChannelName =
  | 'meta-ads'
  | 'google-ads'
  | 'organic-social'
  | 'partnerships';

export interface MarketingChannel {
  name: MarketingChannelName;
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

export interface CrewMember {
  role: string;
  hourlyRate: number;
  count: number;
}

export interface CostBreakdown {
  // Variable costs per event
  suppliesPerChild: number;
  participantsPerEvent: number;
  museumTicketPrice: number;
  ticketsPerEvent: number;
  fuelPricePerGallon: number;
  vehicleMPG: number;
  avgRoundTripMiles: number;
  parkingPerEvent: number;

  // Monthly team salaries (core team)
  ownerSalary: number;
  marketingPerson: number;
  eventCoordinator: number;

  // Monthly vehicle costs
  vehiclePayment: number;
  vehicleInsurance: number;
  vehicleMaintenance: number;

  // Monthly IT & software
  crmSoftware: number;
  websiteHosting: number;
  aiChatbot: number;
  cloudServices: number;
  phonePlan: number;

  // Monthly marketing overhead (beyond ad spend)
  contentCreation: number;
  graphicDesign: number;

  // Monthly other overhead
  storageRent: number;
  equipmentAmortization: number;
  businessLicenses: number;
  miscFixed: number;

  // Custom expenses (user-defined)
  customExpenses: { name: string; amount: number; type: 'per-event' | 'monthly' }[];
}

export interface Operations {
  crew: CrewMember[];
  hoursPerEvent: number;
  capacity: {
    maxBookingsPerDay: number;
    maxBookingsPerWeek: number;
    maxBookingsPerMonth: number;
  };
  travelRadius: number;
  equipment: string[];
  safetyProtocols: string[];
  costBreakdown: CostBreakdown;
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
}

export interface UnitEconomics {
  avgCheck: number;
  costPerEvent: number;
  profitPerEvent: number;
  breakEvenEvents: number;
}

export interface FinancialProjections {
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
  avgCheck: number;
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
  | LaunchPlan;

export type SectionSlug =
  | 'executive-summary'
  | 'market-analysis'
  | 'product-service'
  | 'marketing-strategy'
  | 'operations'
  | 'financial-projections'
  | 'risks-due-diligence'
  | 'kpis-metrics'
  | 'launch-plan';

// --- Business Plan Metadata ---

export interface BusinessPlan {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
