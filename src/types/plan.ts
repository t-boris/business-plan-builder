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

export interface MarketAnalysis {
  targetDemographic: {
    ageRange: string;
    location: string;
    radius: number;
  };
  marketSize: string;
  competitors: Competitor[];
  demographics: {
    population: number;
    languages: string[];
    income: string;
  };
}

// --- Section 3: Product/Service ---

export interface Package {
  name: string;
  price: number;
  duration: string;
  maxParticipants: number;
  includes: string[];
  description: string;
}

export interface AddOn {
  name: string;
  price: number;
}

export interface ProductService {
  packages: Package[];
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

export interface Operations {
  crew: CrewMember[];
  capacity: {
    maxBookingsPerDay: number;
    maxBookingsPerWeek: number;
    maxBookingsPerMonth: number;
  };
  travelRadius: number;
  equipment: string[];
  safetyProtocols: string[];
}

// --- Section 6: Financial Projections ---

export interface MonthlyCosts {
  marketing: number;
  labor: number;
  supplies: number;
  museum: number;
  transport: number;
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
}

// --- Section 7: Risks & Due Diligence ---

export type RiskCategory = 'regulatory' | 'operational' | 'financial' | 'legal';
export type RiskSeverity = 'high' | 'medium' | 'low';

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

export interface RisksDueDiligence {
  risks: Risk[];
  complianceChecklist: ComplianceItem[];
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
