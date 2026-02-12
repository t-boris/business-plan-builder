import type { SectionSlug } from '@/types';
import type { ComputedMetrics } from '@/store/derived-atoms';
import { getSectionPrompt } from './section-prompts';

/** Compressed business overview (generic placeholder until Phase 8 makes dynamic). */
export function buildBusinessOverview(): string {
  return `BUSINESS: [Not configured — business profile will be set in Phase 8]
PACKAGES: See product-service section data
TARGETS: See scenario metrics`;
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
