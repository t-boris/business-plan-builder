import { z } from 'zod';
import type { SectionSlug } from '@/types';

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
  }),
  marketSize: z.string(),
  competitors: z.array(CompetitorSchema),
  demographics: z.object({
    population: z.number(),
    languages: z.array(z.string()),
    income: z.string(),
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

const OperationsSchema = z.object({
  crew: z.array(CrewMemberSchema),
  capacity: z.object({
    maxBookingsPerDay: z.number(),
    maxBookingsPerWeek: z.number(),
    maxBookingsPerMonth: z.number(),
  }),
  travelRadius: z.number(),
  equipment: z.array(z.string()),
  safetyProtocols: z.array(z.string()),
});

const RiskSchema = z.object({
  category: z.enum(['regulatory', 'operational', 'financial', 'legal']),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  mitigation: z.string(),
});

const ComplianceItemSchema = z.object({
  item: z.string(),
  status: z.enum(['complete', 'pending', 'not-started']),
});

const RisksDueDiligenceSchema = z.object({
  risks: z.array(RiskSchema),
  complianceChecklist: z.array(ComplianceItemSchema),
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
      'Generate market analysis for Fun Box. Include target demographic (age range, location, radius), market size estimate (TAM/SAM/SOM for Miami mobile kids entertainment), competitor analysis (3-5 competitors with pricing, strengths, weaknesses), and demographics (population, languages, income). Use Miami-Dade data: population ~2.7M, 75.3% non-English speakers at home.',
    improve:
      'Improve the existing market analysis. Keep all current data, enhance competitor analysis, add more specific market sizing data, and strengthen demographic insights.',
    expand:
      'Expand the existing market analysis with more detail. Keep all current data, add depth to competitor analysis, elaborate on market trends, and include more demographic data points.',
  },
  'product-service': {
    generate:
      'Generate product and service descriptions for Fun Box. Include three packages (Ocean Starter $800, Ocean Explorer $980, Ocean VIP $1,200) with duration, max participants (15), includes list, and descriptions. Also suggest 3-5 relevant add-ons with prices.',
    improve:
      'Improve the existing product descriptions. Keep all current data, enhance package descriptions to be more compelling, and refine add-on offerings.',
    expand:
      'Expand the existing product descriptions with more detail. Keep all current data, add more items to includes lists, elaborate on descriptions, and suggest additional add-ons.',
  },
  'marketing-strategy': {
    generate:
      'Generate a marketing strategy for Fun Box. Include channels (Meta Ads, Google Ads, Organic Social, Partnerships) with budgets, expected leads, CAC, descriptions, and tactics. Add 4-6 promotional offers, and landing page description. Total monthly ad spend should align with scenario metrics.',
    improve:
      'Improve the existing marketing strategy. Keep all current data, enhance channel descriptions, refine tactics, and strengthen promotional offers.',
    expand:
      'Expand the existing marketing strategy with more detail. Keep all current data, add more tactics per channel, elaborate on offers, and add landing page optimization ideas.',
  },
  operations: {
    generate:
      'Generate operations plan for Fun Box. Include crew members (roles, hourly rates, counts), capacity limits (per day/week/month), travel radius, equipment list, and safety protocols. Factor in Miami-specific considerations (heat, outdoor events, bilingual requirements).',
    improve:
      'Improve the existing operations plan. Keep all current data, enhance safety protocols, refine capacity planning, and add operational detail.',
    expand:
      'Expand the existing operations plan with more detail. Keep all current data, add more equipment items, elaborate on safety protocols, and add operational procedures.',
  },
  'financial-projections': {
    generate:
      'CRITICAL: Use ONLY the numbers from SCENARIO METRICS. Do not invent revenue or cost figures. Generate a narrative analysis of the financial projections covering: revenue growth trajectory, cost structure breakdown, path to profitability, key financial assumptions, and risks to the financial plan. Format as structured markdown text.',
    improve:
      'Improve the existing financial narrative. Keep all factual numbers unchanged. Enhance the analysis, add insights about cost optimization, and strengthen the profitability narrative.',
    expand:
      'Expand the existing financial narrative with more detail. Keep all numbers unchanged. Add deeper analysis of margins, unit economics commentary, and seasonal considerations for Miami market.',
  },
  'risks-due-diligence': {
    generate:
      'Generate risk assessment for Fun Box using deep research context: Miami-Dade parking regulations for large trailers, Jellyfish Museum contract dependency (opens Feb 2026), FTSA compliance for automated messaging, slime/chemical activity risks (documented dermatitis/burn risk), insurance requirements. Include compliance checklist items. Categorize risks as regulatory/operational/financial/legal with high/medium/low severity.',
    improve:
      'Improve the existing risk assessment. Keep all current risks, enhance mitigation strategies, add more specific regulatory references, and strengthen compliance items.',
    expand:
      'Expand the existing risk assessment with more detail. Keep all current risks, add more risks if relevant, elaborate on mitigation strategies, and add compliance items.',
  },
  'kpis-metrics': {
    generate:
      'Generate KPI targets for Fun Box based on the business context. Include monthly leads, conversion rate (as decimal e.g. 0.2 for 20%), average check, CAC per lead, CAC per booking, and monthly bookings. Base targets on the scenario metrics provided.',
    improve:
      'Improve the existing KPI targets. Keep all current targets, refine values to be more realistic based on context, and ensure consistency with scenario metrics.',
    expand:
      'Expand the existing KPI targets. Keep all current targets, adjust values if needed for consistency, and ensure all metrics align with the overall business plan.',
  },
  'launch-plan': {
    generate:
      'Generate a launch plan for Fun Box with 3-4 stages: Preparation (Jan-Feb 2026), Soft Launch (Mar 1-14, 2026), Scale (Mar 15 - Jun 2026), and optionally Optimize (Jul-Dec 2026). Each stage should have 4-6 tasks with status "pending". Include specific, actionable tasks relevant to a mobile kids party service in Miami.',
    improve:
      'Improve the existing launch plan. Keep all current stages and tasks, enhance task descriptions to be more specific, and refine timelines.',
    expand:
      'Expand the existing launch plan with more detail. Keep all current stages, add more tasks per stage, elaborate on descriptions, and consider adding additional stages.',
  },
};

/**
 * Get the prompt instruction for a given section and action.
 */
export function getSectionPrompt(
  slug: SectionSlug,
  action: AiAction,
): string {
  return SECTION_PROMPTS[slug][action];
}
