import type { SectionSlug } from '@/types';
import type { ComputedMetrics } from '@/store/derived-atoms';
import { getSectionPrompt } from './section-prompts';

/** Compressed business overview (~200 tokens). */
export function buildBusinessOverview(): string {
  return `BUSINESS: Fun Box -- premium mobile kids birthday party service, Miami FL
PACKAGES: Ocean Starter $800, Ocean Explorer $980, Ocean VIP $1,200 (15 pax each)
TARGETS: 100-150 leads/month, 15-25% conversion, $10-30 CAC/lead
LAUNCH: March 2026
MARKET: Miami-Dade, 15-25 mile radius, parents 28-50`;
}

/** Format scenario metrics as text context. */
export function buildScenarioContext(metrics: ComputedMetrics): string {
  return `SCENARIO METRICS: Monthly Revenue: $${metrics.monthlyRevenue.toLocaleString()}, Monthly Profit: $${metrics.monthlyProfit.toLocaleString()}, Profit Margin: ${(metrics.profitMargin * 100).toFixed(1)}%, Monthly Bookings: ${metrics.monthlyBookings}, CAC/Booking: $${metrics.cacPerBooking.toFixed(0)}, Annual Revenue: $${metrics.annualRevenue.toLocaleString()}`;
}

/** Serialize the current section data as JSON context. */
export function buildSectionContext(
  _sectionSlug: SectionSlug,
  sectionData: unknown,
): string {
  if (!sectionData || (typeof sectionData === 'object' && Object.keys(sectionData as object).length === 0)) {
    return 'Empty -- no data entered yet';
  }
  return JSON.stringify(sectionData, null, 2);
}

/** Assemble full prompt with XML-style tags. */
export function buildPrompt(
  config: {
    sectionSlug: SectionSlug;
    action: 'generate' | 'improve' | 'expand';
    userInstruction?: string;
  },
  sectionData: unknown,
  scenarioMetrics: ComputedMetrics,
): string {
  const businessOverview = buildBusinessOverview();
  const scenarioContext = buildScenarioContext(scenarioMetrics);
  const sectionContext = buildSectionContext(config.sectionSlug, sectionData);
  const taskInstruction = getSectionPrompt(config.sectionSlug, config.action);

  let prompt = `<business_context>
${businessOverview}
${scenarioContext}
</business_context>

<current_section>
${sectionContext}
</current_section>

<task>
${taskInstruction}`;

  if (config.userInstruction) {
    prompt += `\n\nAdditional instruction: ${config.userInstruction}`;
  }

  prompt += '\n</task>';

  return prompt;
}
