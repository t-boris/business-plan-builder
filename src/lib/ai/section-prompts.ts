import { z } from 'zod';
import type { SectionSlug, BusinessType } from '@/types';

// ---- Zod Schemas mirroring TypeScript interfaces from @/types/plan.ts ----

const ExecutiveSummarySchema = z.object({
  summary: z.string().describe('2-3 paragraph executive summary'),
  mission: z.string().describe('One-sentence mission statement'),
  vision: z.string().describe('One-sentence vision statement'),
  keyHighlights: z.array(z.string()).describe('4-6 key business highlights'),
});

const CompetitorSchema = z.object({
  name: z.string(),
  pricing: z.string(),
  strengths: z.string(),
  weaknesses: z.string(),
});

const MarketAnalysisSchema = z.object({
  targetDemographic: z.object({
    ageRange: z.string(),
    location: z.string(),
    radius: z.number(),
    zipCodes: z.array(z.string()),
  }),
  marketSize: z.string(),
  tamDollars: z.number(),
  targetMarketShare: z.string(),
  competitors: z.array(CompetitorSchema),
  demographics: z.object({
    population: z.number(),
    languages: z.array(z.string()),
    income: z.string(),
    householdsWithKids: z.number(),
    annualTourists: z.number(),
  }),
});

const PackageSchema = z.object({
  name: z.string(),
  price: z.number(),
  duration: z.string(),
  maxParticipants: z.number(),
  includes: z.array(z.string()),
  description: z.string(),
});

const AddOnSchema = z.object({
  name: z.string(),
  price: z.number(),
});

const ProductServiceSchema = z.object({
  packages: z.array(PackageSchema),
  addOns: z.array(AddOnSchema),
});

const MarketingChannelSchema = z.object({
  name: z.enum(['meta-ads', 'google-ads', 'organic-social', 'partnerships']),
  budget: z.number(),
  expectedLeads: z.number(),
  expectedCAC: z.number(),
  description: z.string(),
  tactics: z.array(z.string()),
});

const MarketingStrategySchema = z.object({
  channels: z.array(MarketingChannelSchema),
  offers: z.array(z.string()),
  landingPage: z.object({
    url: z.string(),
    description: z.string(),
  }),
});

const CrewMemberSchema = z.object({
  role: z.string(),
  hourlyRate: z.number(),
  count: z.number(),
});

const CostBreakdownSchema = z.object({
  suppliesPerChild: z.number().describe('Cost of supplies/materials per participant'),
  participantsPerEvent: z.number().describe('Number of participants per event'),
  museumTicketPrice: z.number().describe('Venue/ticket cost per person'),
  ticketsPerEvent: z.number().describe('Number of venue tickets per event'),
  fuelPricePerGallon: z.number().describe('Current gas price per gallon'),
  vehicleMPG: z.number().describe('Vehicle fuel efficiency in miles per gallon'),
  avgRoundTripMiles: z.number().describe('Average round trip miles per event'),
  parkingPerEvent: z.number().describe('Parking cost per event'),
  ownerSalary: z.number().describe('Monthly owner/founder salary'),
  marketingPerson: z.number().describe('Monthly marketing/social media manager salary'),
  eventCoordinator: z.number().describe('Monthly event coordinator/sales salary'),
  vehiclePayment: z.number().describe('Monthly vehicle loan/lease payment'),
  vehicleInsurance: z.number().describe('Monthly vehicle insurance'),
  vehicleMaintenance: z.number().describe('Monthly maintenance reserve'),
  crmSoftware: z.number().describe('Monthly CRM and booking platform'),
  websiteHosting: z.number().describe('Monthly website hosting and domain'),
  aiChatbot: z.number().describe('Monthly AI chatbot API costs (Gemini, Instagram bot)'),
  cloudServices: z.number().describe('Monthly cloud services (Firebase, storage)'),
  phonePlan: z.number().describe('Monthly business phone plan'),
  contentCreation: z.number().describe('Monthly content creation (video, photo) costs'),
  graphicDesign: z.number().describe('Monthly graphic design costs'),
  storageRent: z.number().describe('Monthly storage/warehouse rent'),
  equipmentAmortization: z.number().describe('Monthly equipment depreciation'),
  businessLicenses: z.number().describe('Monthly amortized business license cost'),
  miscFixed: z.number().describe('Monthly miscellaneous/buffer costs'),
  customExpenses: z.array(z.object({
    name: z.string().describe('Expense name'),
    amount: z.number().describe('Dollar amount'),
    type: z.enum(['per-event', 'monthly']).describe('Whether this is a per-event or monthly cost'),
  })).describe('Additional custom expenses'),
});

const OperationsSchema = z.object({
  crew: z.array(CrewMemberSchema),
  hoursPerEvent: z.number().describe('Average hours crew works per event'),
  capacity: z.object({
    maxBookingsPerDay: z.number(),
    maxBookingsPerWeek: z.number(),
    maxBookingsPerMonth: z.number(),
  }),
  travelRadius: z.number(),
  equipment: z.array(z.string()),
  safetyProtocols: z.array(z.string()),
  costBreakdown: CostBreakdownSchema,
});

const RiskSchema = z.object({
  category: z.enum(['regulatory', 'operational', 'financial', 'legal', 'safety', 'dependency', 'capacity', 'market']),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  mitigation: z.string(),
});

const ComplianceItemSchema = z.object({
  item: z.string(),
  status: z.enum(['complete', 'pending', 'not-started']),
});

const DueDiligenceItemSchema = z.object({
  item: z.string().describe('Due diligence item title'),
  detail: z.string().describe('Detailed description or findings'),
  priority: z.enum(['required', 'advised']).describe('Whether this is required before launch or advised'),
  status: z.enum(['complete', 'pending', 'not-started']).describe('Current status'),
});

const InvestmentVerdictSchema = z.object({
  verdict: z.enum(['strong-go', 'conditional-go', 'proceed-with-caution', 'defer', 'no-go']).describe('Overall investment verdict'),
  conditions: z.array(z.string()).describe('Conditions or requirements that must be met'),
});

const RisksDueDiligenceSchema = z.object({
  risks: z.array(RiskSchema),
  complianceChecklist: z.array(ComplianceItemSchema),
  investmentVerdict: InvestmentVerdictSchema.optional().describe('Overall investment verdict summary'),
  dueDiligenceChecklist: z.array(DueDiligenceItemSchema).optional().describe('Detailed due diligence checklist items'),
});

const KpiTargetsSchema = z.object({
  monthlyLeads: z.number(),
  conversionRate: z.number(),
  avgCheck: z.number(),
  cacPerLead: z.number(),
  cacPerBooking: z.number(),
  monthlyBookings: z.number(),
});

const KpisMetricsSchema = z.object({
  targets: KpiTargetsSchema,
});

const LaunchTaskSchema = z.object({
  task: z.string(),
  status: z.enum(['done', 'in-progress', 'pending']),
});

const LaunchStageSchema = z.object({
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  tasks: z.array(LaunchTaskSchema),
});

const LaunchPlanSchema = z.object({
  stages: z.array(LaunchStageSchema),
});

// ---- Helper to convert Zod schema to Gemini-compatible JSON schema ----

/**
 * Strip Zod/JSON Schema fields that Gemini does not understand.
 * Gemini expects OpenAPI 3.0-style schema without $schema or additionalProperties.
 */
function toGeminiSchema(zodSchema: z.ZodType): object {
  const raw = z.toJSONSchema(zodSchema);
  return stripUnsupportedFields(raw);
}

function stripUnsupportedFields(obj: unknown): object {
  if (typeof obj !== 'object' || obj === null) return obj as object;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === '$schema' || key === 'additionalProperties') continue;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = stripUnsupportedFields(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? stripUnsupportedFields(item)
          : item,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ---- Schema map ----

const SECTION_SCHEMAS: Partial<Record<SectionSlug, z.ZodType>> = {
  'executive-summary': ExecutiveSummarySchema,
  'market-analysis': MarketAnalysisSchema,
  'product-service': ProductServiceSchema,
  'marketing-strategy': MarketingStrategySchema,
  operations: OperationsSchema,
  'risks-due-diligence': RisksDueDiligenceSchema,
  'kpis-metrics': KpisMetricsSchema,
  'launch-plan': LaunchPlanSchema,
  // financial-projections: null -- uses free-text (numbers come from scenario engine)
};

/**
 * Returns a Gemini-compatible JSON schema for the section, or null for free-text sections.
 */
export function getSectionSchema(slug: SectionSlug): object | null {
  const zodSchema = SECTION_SCHEMAS[slug];
  if (!zodSchema) return null;
  return toGeminiSchema(zodSchema);
}

// ---- Per-section prompt templates ----

type AiAction = 'generate' | 'improve' | 'expand';

const SECTION_PROMPTS: Record<SectionSlug, Record<AiAction, string>> = {
  'executive-summary': {
    generate:
      'Generate an executive summary synthesizing the business context. Include: summary (2-3 paragraphs covering the business model, target market, and competitive advantage), mission (one concise sentence), vision (one aspirational sentence), keyHighlights (4-6 bullet points with specific numbers from context). Reflect ACTUAL numbers from context.',
    improve:
      'Improve the existing executive summary. Keep all current data, enhance descriptions, strengthen the narrative, add specificity, and ensure numbers match the business context.',
    expand:
      'Expand the existing executive summary with more detail. Keep all current data, add depth to each area, elaborate on competitive advantages, and strengthen the vision.',
  },
  'market-analysis': {
    generate:
      'Generate market analysis for the business. Include target demographic (age range, location, radius), market size estimate (TAM/SAM/SOM), competitor analysis (3-5 competitors with pricing, strengths, weaknesses), and demographics (population, languages, income, relevant household data). Use the business context and location data provided.',
    improve:
      'Improve the existing market analysis. Keep all current data, enhance competitor analysis, add more specific market sizing data, and strengthen demographic insights.',
    expand:
      'Expand the existing market analysis with more detail. Keep all current data, add depth to competitor analysis, elaborate on market trends, and include more demographic data points.',
  },
  'product-service': {
    generate:
      'Generate product and service descriptions. Include packages with pricing, duration, max participants, includes list, and descriptions. Suggest 3-5 add-ons with prices.',
    improve:
      'Improve the existing product descriptions. Keep all current data, enhance package descriptions to be more compelling, and refine add-on offerings.',
    expand:
      'Expand the existing product descriptions with more detail. Keep all current data, add more items to includes lists, elaborate on descriptions, and suggest additional add-ons.',
  },
  'marketing-strategy': {
    generate:
      'Generate marketing strategy. Include marketing channels with budgets, expected leads, CAC, descriptions, and tactics. Add promotional offers and landing page description. Total monthly ad spend should align with scenario metrics.',
    improve:
      'Improve the existing marketing strategy. Keep all current data, enhance channel descriptions, refine tactics, and strengthen promotional offers.',
    expand:
      'Expand the existing marketing strategy with more detail. Keep all current data, add more tactics per channel, elaborate on offers, and add landing page optimization ideas.',
  },
  operations: {
    generate:
      'Generate operations plan. Include staff/crew (roles, hourly rates, counts), hoursPerEvent, capacity limits (per day/week/month), travel radius, equipment list, safety protocols, and full costBreakdown with realistic estimates for the business location.',
    improve:
      'Improve the existing operations plan. Keep all current data, refine cost estimates to be more realistic for the business\'s market, enhance safety protocols, and optimize capacity planning.',
    expand:
      'Expand the existing operations plan with more detail. Keep all current data, add more equipment items, elaborate on safety protocols, refine cost breakdown with more precise estimates.',
  },
  'financial-projections': {
    generate:
      'CRITICAL: Use ONLY the numbers from SCENARIO METRICS. Do not invent revenue or cost figures. Generate a narrative analysis of the financial projections covering: revenue growth trajectory, cost structure breakdown, path to profitability, key financial assumptions, and risks to the financial plan. Format as structured markdown text.',
    improve:
      'Improve the existing financial narrative. Keep all factual numbers unchanged. Enhance the analysis, add insights about cost optimization, and strengthen the profitability narrative.',
    expand:
      'Expand the existing financial narrative with more detail. Keep all numbers unchanged. Add deeper analysis of margins, unit economics commentary, and seasonal considerations for the business\'s market.',
  },
  'risks-due-diligence': {
    generate:
      'Generate investor-grade risk assessment and due diligence for the business. Include risks with categories (regulatory/operational/financial/legal/safety/dependency/capacity/market) and severity levels (critical/high/medium/low). Include investmentVerdict with verdict (strong-go/conditional-go/proceed-with-caution/defer/no-go) and conditions list. Include dueDiligenceChecklist with items (priority: required/advised, detail, status). Include complianceChecklist. Base all risks and due diligence items on the business context provided.',
    improve:
      'Improve the existing risk assessment and due diligence. Keep all current risks, enhance mitigation strategies, add more specific regulatory references, strengthen due diligence items with more detail, and refine the investment verdict conditions.',
    expand:
      'Expand the existing risk assessment with more detail. Keep all current risks, add more risks if relevant (especially safety/dependency/capacity/market categories), elaborate on mitigation strategies, add due diligence items, and expand investment verdict conditions.',
  },
  'kpis-metrics': {
    generate:
      'Generate KPI targets based on the business context. Include monthly leads, conversion rate (as decimal e.g. 0.2 for 20%), average check, CAC per lead, CAC per booking, and monthly bookings. Base targets on the scenario metrics provided.',
    improve:
      'Improve the existing KPI targets. Keep all current targets, refine values to be more realistic based on context, and ensure consistency with scenario metrics.',
    expand:
      'Expand the existing KPI targets. Keep all current targets, adjust values if needed for consistency, and ensure all metrics align with the overall business plan.',
  },
  'launch-plan': {
    generate:
      'Generate a launch plan with 3-4 stages. Each stage should have 4-6 tasks with status "pending". Include specific, actionable tasks relevant to the business.',
    improve:
      'Improve the existing launch plan. Keep all current stages and tasks, enhance task descriptions to be more specific, and refine timelines.',
    expand:
      'Expand the existing launch plan with more detail. Keep all current stages, add more tasks per stage, elaborate on descriptions, and consider adding additional stages.',
  },
};

// ---- Industry-specific overlays for generate action ----

const INDUSTRY_OVERLAYS: Partial<Record<BusinessType, Partial<Record<SectionSlug, string>>>> = {
  saas: {
    'market-analysis': 'Focus on: TAM/SAM/SOM with bottom-up and top-down estimates. Competitor analysis should include pricing tiers, feature comparison matrix, funding status, and market positioning. Include technology adoption lifecycle stage. Address switching costs and lock-in factors. Demographics should focus on company size segments, industry verticals, and buying committee roles.',
    'financial-projections': 'Emphasize SaaS-specific metrics: MRR/ARR growth trajectory, churn rate (logo and revenue), LTV:CAC ratio, months to payback, net revenue retention, expansion revenue. Model cohort-based revenue patterns rather than simple linear growth.',
    operations: 'Focus on: engineering team structure, sprint velocity, cloud infrastructure costs by tier, customer support staffing ratios, deployment pipeline. Cost breakdown should emphasize cloud infrastructure, third-party APIs, developer tooling, and customer success headcount.',
    'marketing-strategy': 'Focus on: content marketing and SEO, product-led acquisition funnels, free trial/freemium conversion rates, developer relations if applicable. Consider inbound vs outbound mix. CAC should be broken down by channel.',
  },
  restaurant: {
    'market-analysis': 'Focus on: location-specific foot traffic data, nearby anchor tenants, parking availability, delivery radius and third-party delivery platform presence (DoorDash, UberEats). Competitor analysis should include seating capacity, average ticket, Yelp/Google ratings, cuisine overlap, and peak hour patterns. Demographics should focus on daytime vs evening population, household income, dining-out frequency.',
    'financial-projections': 'Emphasize restaurant-specific metrics: food cost percentage (target 28-32%), labor cost percentage (target 25-30%), prime cost, revenue per available seat hour (RevPASH), average covers per day. Model seasonal variations in covers if the location has tourism patterns.',
    operations: 'Focus on: kitchen layout and stations, FOH/BOH staffing by shift, food cost percentage targets, inventory turnover, prep schedules, health code compliance, and vendor relationships. Cost breakdown should emphasize food cost, labor, rent, utilities, POS system, and waste reduction.',
    'marketing-strategy': 'Focus on: local SEO and Google Business Profile optimization, delivery platform presence and commission impact, review management strategy (Yelp/Google), loyalty programs, community events. Emphasize cost-per-cover acquisition.',
  },
  retail: {
    'market-analysis': 'Focus on: trade area analysis, foot traffic patterns and peak hours, anchor tenant proximity, online-to-offline conversion potential, seasonal demand curves. Competitor analysis should include price positioning, product assortment overlap, store formats, and loyalty programs. Demographics should focus on household income, spending patterns by category.',
    'financial-projections': 'Emphasize retail-specific metrics: inventory turnover rate, gross margin return on investment (GMROI), sell-through rate, average transaction value (ATV), markdown strategy impact. Model seasonal revenue patterns by quarter.',
    operations: 'Focus on: store layout and merchandising zones, staffing by shift and season, inventory management and reorder points, POS systems, loss prevention, seasonal staffing plans. Cost breakdown should emphasize COGS, labor, rent, shrinkage, and logistics.',
    'marketing-strategy': 'Focus on: foot traffic driving tactics, seasonal promotions calendar, loyalty program design, omnichannel attribution (online-to-store, store-to-online), local advertising. Emphasize cost-per-transaction acquisition.',
  },
  service: {
    'market-analysis': 'Focus on: serviceable market by geography/specialty, client acquisition channels, referral network potential, competitive landscape by specialization. Demographics should focus on target client profiles (B2B: company size and industry; B2C: income and life stage).',
    'financial-projections': 'Emphasize service-specific metrics: utilization rate, average billable rate, revenue per employee, client lifetime value, project profitability. Model capacity constraints and growth scenarios.',
    operations: 'Focus on: team structure and specializations, capacity planning and utilization targets, service delivery workflow, quality assurance processes, client communication cadence. Cost breakdown should emphasize labor (largest cost), professional development, tools/software, and insurance.',
    'marketing-strategy': 'Focus on: referral programs, professional networking, thought leadership content, case studies and testimonials, partnership channels. Emphasize cost-per-client acquisition and client retention rates.',
  },
  event: {
    'market-analysis': 'Focus on: event market by type and season, venue availability and pricing, local competition for similar events, seasonal demand patterns. Demographics should focus on target attendee profiles, corporate vs consumer segments, willingness to pay.',
    'financial-projections': 'Emphasize event-specific metrics: per-event revenue and cost, capacity utilization, booking lead time, seasonal revenue distribution, break-even number of events per month. Model seasonal curves explicitly.',
    operations: 'Focus on: event logistics and setup/teardown, staffing per event type, equipment inventory and maintenance, venue partnerships, safety protocols and insurance. Cost breakdown should emphasize per-event variable costs vs monthly fixed overhead.',
    'marketing-strategy': 'Focus on: social media and visual marketing, event listing platforms, partnership and cross-promotion, early-bird and group pricing strategies, email marketing for repeat clients. Emphasize booking conversion rate from inquiries.',
  },
  manufacturing: {
    'market-analysis': 'Focus on: supply chain geography, raw material sourcing and pricing trends, trade regulations and tariffs, capacity utilization benchmarks in the industry. Competitor analysis should include production capabilities, quality certifications, and pricing models (cost-plus vs market-based).',
    'financial-projections': 'Emphasize manufacturing-specific metrics: unit COGS breakdown (materials, labor, overhead), yield rate, capacity utilization impact on unit cost, raw material cost sensitivity analysis. Model production ramp-up scenarios.',
    operations: 'Focus on: production line layout, shift scheduling and labor planning, quality control checkpoints, equipment maintenance schedules, supplier management and lead times. Cost breakdown should emphasize raw materials, direct labor, manufacturing overhead, and logistics.',
    'marketing-strategy': 'Focus on: trade shows and industry events, B2B sales cycle and pipeline management, distributor/channel partner relationships, technical documentation and specs, certifications as marketing leverage. Emphasize customer acquisition cost for B2B sales.',
  },
};

/**
 * Get the prompt instruction for a given section and action.
 * When businessType is provided and action is 'generate', appends industry-specific overlay.
 */
export function getSectionPrompt(
  slug: SectionSlug,
  action: AiAction,
  businessType?: BusinessType,
): string {
  const base = SECTION_PROMPTS[slug][action];
  if (!businessType || businessType === 'custom' || action !== 'generate') return base;
  const overlay = INDUSTRY_OVERLAYS[businessType]?.[slug];
  if (!overlay) return base;
  return `${base}\n\nINDUSTRY-SPECIFIC FOCUS (${businessType}):\n${overlay}`;
}
