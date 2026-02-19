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

const CustomMetricSchema = z.object({
  label: z.string().describe('Metric name'),
  value: z.string().describe('Metric value'),
  source: z.string().describe('Data source'),
});

const CalcStepSchema = z.object({
  label: z.string().describe('Step label, e.g. "Total industry market"'),
  value: z.number().describe('Step value (dollar amount, percentage, or count)'),
  type: z.enum(['currency', 'percentage', 'count']).describe('How to interpret the value'),
});

const TamConfigSchema = z.object({
  approach: z.enum(['top-down', 'bottom-up', 'custom']).describe('TAM calculation approach'),
  steps: z.array(CalcStepSchema).describe('Calculation steps whose product equals TAM'),
});

const SamConfigSchema = z.object({
  steps: z.array(CalcStepSchema).describe('Filter steps applied to TAM to get SAM'),
});

const SomConfigSchema = z.object({
  steps: z.array(CalcStepSchema).describe('Capture steps applied to SAM to get SOM'),
});

const MarketSizingSchema = z.object({
  tam: TamConfigSchema.describe('TAM calculation config'),
  sam: SamConfigSchema.describe('SAM calculation config'),
  som: SomConfigSchema.describe('SOM calculation config'),
});

const FunnelStageSchema = z.object({
  label: z.string().describe('Funnel stage name'),
  description: z.string().describe('How this stage works, channels used, tactics'),
  volume: z.number().describe('Number of people/leads at this stage'),
  conversionRate: z.number().describe('Conversion rate 0-100 to next stage'),
});

const AdoptionModelSchema = z.object({
  type: z.enum(['linear', 's-curve']).describe('Adoption curve type'),
  totalMarket: z.number().describe('Total addressable users'),
  initialUsers: z.number().describe('Starting user count'),
  growthRate: z.number().describe('Growth rate parameter'),
  projectionMonths: z.number().describe('Number of months to project'),
});

const MarketAnalysisBlocksSchema = z.object({
  sizing: z.boolean(),
  competitors: z.boolean(),
  demographics: z.boolean(),
  acquisitionFunnel: z.boolean(),
  adoptionModel: z.boolean(),
  customMetrics: z.boolean(),
});

const MarketAnalysisSchema = z.object({
  enabledBlocks: MarketAnalysisBlocksSchema.describe('Which blocks are enabled'),
  marketSizing: MarketSizingSchema.describe('TAM/SAM/SOM step-based market sizing. Each level has calculation steps whose product gives the result. TAM steps multiply to TAM, SAM steps filter TAM, SOM steps capture from SAM.'),
  marketNarrative: z.string().describe('Market opportunity narrative'),
  competitors: z.array(CompetitorSchema),
  demographics: z.object({
    population: z.number(),
    income: z.string(),
    metrics: z.array(CustomMetricSchema).describe('Additional demographic metrics'),
  }),
  acquisitionFunnel: z.array(FunnelStageSchema).describe('Customer acquisition funnel stages'),
  adoptionModel: AdoptionModelSchema.describe('Market adoption projection parameters'),
  customMetrics: z.array(CustomMetricSchema).describe('User-defined custom metrics'),
});

const OfferingSchema = z.object({
  id: z.string().describe('Unique identifier for the offering'),
  name: z.string().describe('Clear, descriptive name for this product or service'),
  description: z.string().describe('Detailed description explaining what this offering includes, who it is for, and what value it delivers. Write 2-4 sentences minimum.'),
  price: z.number().nullable().describe('Price in dollars. Use null if pricing is "on request" or varies.'),
  priceLabel: z.string().optional().describe('Pricing qualifier, e.g. "per month", "per hour", "per unit", "starting from"'),
  addOnIds: z.array(z.string()).describe('IDs of add-ons linked to this offering. Reference IDs from the addOns array.'),
});

const AddOnSchema = z.object({
  id: z.string().describe('Unique identifier for the add-on'),
  name: z.string().describe('Clear name for this add-on'),
  description: z.string().optional().describe('Brief description of what this add-on provides'),
  price: z.number().describe('Price in dollars'),
  priceLabel: z.string().optional().describe('Pricing qualifier, e.g. "per unit", "one-time", "per month"'),
});

const ProductServiceSchema = z.object({
  overview: z.string().optional().describe('Brief overview of the entire product/service line. 1-3 sentences positioning the business offering.'),
  offerings: z.array(OfferingSchema).describe('List of products or services offered'),
  addOns: z.array(AddOnSchema).describe('Optional extras that can be linked to offerings'),
});

const MarketingChannelSchema = z.object({
  name: z.string().describe('Channel name, e.g. "Google Ads", "Instagram", "Email Marketing", "Partnerships"'),
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

const WorkforceMemberSchema = z.object({
  role: z.string().describe('Job role or position title'),
  count: z.number().describe('Number of people in this role'),
  ratePerHour: z.number().describe('Hourly rate for this role'),
});

const CapacityConfigSchema = z.object({
  outputUnitLabel: z.string().describe('What the business produces: units, orders, bookings, meals, etc.'),
  plannedOutputPerMonth: z.number().describe('Planned monthly output volume'),
  maxOutputPerDay: z.number().describe('Maximum output capacity per day'),
  maxOutputPerWeek: z.number().describe('Maximum output capacity per week'),
  maxOutputPerMonth: z.number().describe('Maximum output capacity per month'),
  utilizationRate: z.number().describe('Target utilization rate as percentage 0-100'),
});

const CostItemSchema = z.object({
  category: z.string().describe('Cost category name, e.g. Raw Materials, Rent, Software'),
  type: z.enum(['variable', 'fixed']).describe('Variable costs scale with output, fixed costs stay constant'),
  rate: z.number().describe('Cost amount per driver unit'),
  driverType: z.enum(['per-unit', 'per-order', 'per-service-hour', 'per-machine-hour', 'monthly', 'quarterly', 'yearly'])
    .describe('What drives this cost: per unit of output, per time period, etc.'),
  driverQuantityPerMonth: z.number().describe('How many driver units per month'),
});

const OperationalMetricSchema = z.object({
  name: z.string().describe('Metric name, e.g. Yield Rate, OEE, Customer Satisfaction'),
  unit: z.string().describe('Measurement unit: %, units, hours, score'),
  value: z.number().describe('Current measured value'),
  target: z.number().describe('Target value to achieve'),
});

const OperationsSchema = z.object({
  workforce: z.array(WorkforceMemberSchema).describe('Team members and their roles'),
  capacity: CapacityConfigSchema,
  costItems: z.array(CostItemSchema).describe('All operational costs — both variable and fixed'),
  equipment: z.array(z.string()).describe('List of equipment and tools'),
  safetyProtocols: z.array(z.string()).describe('Safety procedures and protocols'),
  operationalMetrics: z.array(OperationalMetricSchema).describe('Key operational performance metrics'),
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
      'Generate investor-grade market analysis. Include: enabledBlocks (all true), marketSizing with step-based TAM/SAM/SOM calculations (TAM: use top-down approach with 2-3 steps like total industry market as currency + relevant segment as percentage; SAM: 1-2 filter steps as percentages; SOM: 1 capture rate step as percentage), marketNarrative describing the opportunity, 3-5 competitors with pricing/strengths/weaknesses, demographics with population/income and 2-3 additional metrics, a 5-stage acquisitionFunnel (Awareness → Interest → Evaluation → Trial → Customer) with realistic volumes and conversion rates, an s-curve adoptionModel with realistic parameters, and 2-3 customMetrics.',
    improve:
      'Improve the existing market analysis. Keep all current data, enhance TAM/SAM/SOM calculation steps with better labels and more realistic values, refine competitor analysis, improve funnel conversion rates for realism, and strengthen adoption model parameters.',
    expand:
      'Expand the existing market analysis with more detail. Keep all current data, add more calculation steps to TAM/SAM/SOM for finer granularity, elaborate on market narrative, add more demographic metrics, refine funnel stages, and include more custom metrics.',
  },
  'product-service': {
    generate:
      'Generate a complete product and service catalog for this business. Create 3-5 distinct offerings, each with a descriptive name, detailed description (2-4 sentences explaining value, target audience, and what is included), realistic pricing with appropriate price labels (per month, per hour, per unit, etc.). Generate 3-5 add-ons with prices and brief descriptions. Link relevant add-ons to offerings via addOnIds. Write a brief overview paragraph positioning the overall product/service line. Each offering must have a unique id (use format "off-1", "off-2", etc.) and each add-on must have a unique id (use format "addon-1", "addon-2", etc.). Do NOT use tier labels like Starter, Basic, Pro, Premium, or Enterprise as offering names — use descriptive names that reflect what the offering actually is.',
    improve:
      'Improve the existing product and service descriptions. Keep all current offerings and add-ons but enhance descriptions to be more detailed, compelling, and customer-focused. Refine pricing labels for clarity. Improve the overview to better position the business. Preserve all existing ids and addOnId links.',
    expand:
      'Expand the existing product and service catalog. Keep all current offerings and add-ons unchanged. Add 1-2 new offerings and 2-3 new add-ons with full descriptions. Link new add-ons to relevant offerings. Enhance the overview if needed. Use unique ids for new items.',
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
    'market-analysis': 'Focus on: TAM steps starting from global SaaS category spend (currency) then relevant segment (percentage), SAM filter by deployment model (percentage), SOM by outbound capacity (percentage). Funnel: Website → Trial → Active → Paid → Expansion. Competitor analysis should include pricing tiers, funding status, and market positioning. Demographics should focus on company size segments and industry verticals.',
    'financial-projections': 'Emphasize SaaS-specific metrics: MRR/ARR growth trajectory, churn rate (logo and revenue), LTV:CAC ratio, months to payback, net revenue retention, expansion revenue. Model cohort-based revenue patterns rather than simple linear growth.',
    operations: 'Focus on: engineering team structure, sprint velocity, cloud infrastructure costs by tier, customer support staffing ratios, deployment pipeline. Cost breakdown should emphasize cloud infrastructure, third-party APIs, developer tooling, and customer success headcount.',
    'marketing-strategy': 'Focus on: content marketing and SEO, product-led acquisition funnels, free trial/freemium conversion rates, developer relations if applicable. Consider inbound vs outbound mix. CAC should be broken down by channel.',
    'product-service': 'Generate SaaS subscription offerings. Use recurring pricing (per month, per year). Focus on feature tiers differentiated by usage limits, integrations, or support levels. Common add-ons: extra storage, priority support, API access, custom integrations, dedicated account manager.',
  },
  restaurant: {
    'market-analysis': 'Focus on: TAM steps from local dining market total (currency) then cuisine category share (percentage), SAM filter by location reach (percentage), SOM by seating capacity capture (percentage). Funnel: Awareness → Visit → Return → Regular → Advocate. Competitor analysis should include seating capacity, average ticket, and Yelp/Google ratings. Demographics should focus on daytime vs evening population, household income, and dining-out frequency.',
    'financial-projections': 'Emphasize restaurant-specific metrics: food cost percentage (target 28-32%), labor cost percentage (target 25-30%), prime cost, revenue per available seat hour (RevPASH), average covers per day. Model seasonal variations in covers if the location has tourism patterns.',
    operations: 'Focus on: kitchen layout and stations, FOH/BOH staffing by shift, food cost percentage targets, inventory turnover, prep schedules, health code compliance, and vendor relationships. Cost breakdown should emphasize food cost, labor, rent, utilities, POS system, and waste reduction.',
    'marketing-strategy': 'Focus on: local SEO and Google Business Profile optimization, delivery platform presence and commission impact, review management strategy (Yelp/Google), loyalty programs, community events. Emphasize cost-per-cover acquisition.',
    'product-service': 'Generate menu categories or dining experiences as offerings. Price per person or per table. Focus on cuisine description, portion details, and dietary information. Common add-ons: wine pairing, private room, live entertainment, custom menu, event hosting.',
  },
  retail: {
    'market-analysis': 'Focus on: TAM steps from total retail category in trade area (currency) then product category share (percentage), SAM filter by assortment match (percentage), SOM by foot traffic capture rate (percentage). Funnel: Awareness → Store Visit → Browse → Purchase → Repeat. Competitor analysis should include price positioning, product assortment overlap, and store formats. Demographics should focus on household income and spending patterns.',
    'financial-projections': 'Emphasize retail-specific metrics: inventory turnover rate, gross margin return on investment (GMROI), sell-through rate, average transaction value (ATV), markdown strategy impact. Model seasonal revenue patterns by quarter.',
    operations: 'Focus on: store layout and merchandising zones, staffing by shift and season, inventory management and reorder points, POS systems, loss prevention, seasonal staffing plans. Cost breakdown should emphasize COGS, labor, rent, shrinkage, and logistics.',
    'marketing-strategy': 'Focus on: foot traffic driving tactics, seasonal promotions calendar, loyalty program design, omnichannel attribution (online-to-store, store-to-online), local advertising. Emphasize cost-per-transaction acquisition.',
    'product-service': 'Generate product categories or product lines as offerings. Focus on materials, specifications, and target customer. Common add-ons: gift wrapping, express shipping, extended warranty, personalization, insurance.',
  },
  service: {
    'market-analysis': 'Focus on: TAM steps from serviceable market by geography/specialty (currency) then relevant niche (percentage), SAM filter by client type reach (percentage), SOM by capacity and referral network (percentage). Funnel: Lead → Consultation → Proposal → Contract → Repeat. Demographics should focus on target client profiles (B2B: company size and industry; B2C: income and life stage).',
    'financial-projections': 'Emphasize service-specific metrics: utilization rate, average billable rate, revenue per employee, client lifetime value, project profitability. Model capacity constraints and growth scenarios.',
    operations: 'Focus on: team structure and specializations, capacity planning and utilization targets, service delivery workflow, quality assurance processes, client communication cadence. Cost breakdown should emphasize labor (largest cost), professional development, tools/software, and insurance.',
    'marketing-strategy': 'Focus on: referral programs, professional networking, thought leadership content, case studies and testimonials, partnership channels. Emphasize cost-per-client acquisition and client retention rates.',
    'product-service': 'Generate service packages or engagement types as offerings. Price per hour, per project, or retainer. Focus on scope of work, deliverables, and timeline. Common add-ons: rush delivery, additional revisions, on-site visits, priority support.',
  },
  event: {
    'market-analysis': 'Focus on: TAM steps from total event spending in market (currency) then event type segment (percentage), SAM filter by geographic reach (percentage), SOM by booking capacity (percentage). Funnel: Awareness → Inquiry → Quote → Booking → Repeat. Demographics should focus on target attendee profiles, corporate vs consumer segments, willingness to pay.',
    'financial-projections': 'Emphasize event-specific metrics: per-event revenue and cost, capacity utilization, booking lead time, seasonal revenue distribution, break-even number of events per month. Model seasonal curves explicitly.',
    operations: 'Focus on: event logistics and setup/teardown, staffing per event type, equipment inventory and maintenance, venue partnerships, safety protocols and insurance. Cost breakdown should emphasize per-event variable costs vs monthly fixed overhead.',
    'marketing-strategy': 'Focus on: social media and visual marketing, event listing platforms, partnership and cross-promotion, early-bird and group pricing strategies, email marketing for repeat clients. Emphasize booking conversion rate from inquiries.',
    'product-service': 'Generate event packages or experience types as offerings. Focus on what is included, duration, capacity, and venue details. Common add-ons: photography, videography, extra hours, custom decorations, live music, catering upgrades.',
  },
  manufacturing: {
    'market-analysis': 'Focus on: TAM steps from total industry output (currency) then capability segment (percentage), SAM filter by capability match (percentage), SOM by production capacity (percentage). Funnel: Lead → RFQ → Sample → PO → Repeat. Competitor analysis should include production capabilities, quality certifications, and pricing models.',
    'financial-projections': 'Emphasize manufacturing-specific metrics: unit COGS breakdown (materials, labor, overhead), yield rate, capacity utilization impact on unit cost, raw material cost sensitivity analysis. Model production ramp-up scenarios.',
    operations: 'Focus on: production line layout, shift scheduling and labor planning, quality control checkpoints, equipment maintenance schedules, supplier management and lead times. Cost breakdown should emphasize raw materials, direct labor, manufacturing overhead, and logistics.',
    'marketing-strategy': 'Focus on: trade shows and industry events, B2B sales cycle and pipeline management, distributor/channel partner relationships, technical documentation and specs, certifications as marketing leverage. Emphasize customer acquisition cost for B2B sales.',
    'product-service': 'Generate manufactured products or production services as offerings. Focus on specifications, materials, minimum order quantities, and lead times. Price per unit or per batch. Common add-ons: custom packaging, quality certification, expedited production, installation, maintenance plans.',
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
