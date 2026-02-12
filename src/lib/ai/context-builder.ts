import type { SectionSlug, BusinessProfile, VariableDefinition } from '@/types';
import { getSectionPrompt } from './section-prompts';

/** Build a human-readable business profile block, or a fallback if no profile is available. */
export function buildBusinessProfile(
  profile: BusinessProfile | null,
): string {
  if (!profile) {
    return 'Business profile not configured.';
  }
  return `Name: ${profile.name}
Type: ${profile.type}
Industry: ${profile.industry}
Location: ${profile.location}
Description: ${profile.description}`;
}

/** Format a single metric value based on its variable definition unit. */
function formatMetricValue(
  value: number,
  definition?: VariableDefinition,
): string {
  if (!definition) {
    return value.toLocaleString();
  }
  switch (definition.unit) {
    case 'currency':
      return `$${value.toLocaleString()}`;
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'count':
    case 'months':
    case 'days':
    case 'hours':
      return Math.round(value).toLocaleString();
    case 'ratio':
      return value.toFixed(2);
    default:
      return value.toLocaleString();
  }
}

/** Format evaluated scenario metrics as text context with units when variable definitions are available. */
export function buildScenarioContext(
  metrics: Record<string, number>,
  variableDefinitions?: Record<string, VariableDefinition>,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(metrics)) {
    const definition = variableDefinitions?.[key];
    const label = definition?.label
      ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const formatted = formatMetricValue(value, definition);
    parts.push(`- ${label}: ${formatted}`);
  }

  if (parts.length === 0) {
    return 'No scenario metrics available.';
  }

  return `These are ACTUAL calculated scenario values. Use these exact numbers, do not estimate or round:\n${parts.join('\n')}`;
}

/** Serialize the current section data as JSON context. */
export function buildSectionContext(
  _sectionSlug: SectionSlug,
  sectionData: unknown,
): string {
  if (
    !sectionData ||
    (typeof sectionData === 'object' &&
      Object.keys(sectionData as object).length === 0)
  ) {
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
  profile: BusinessProfile | null,
  sectionData: unknown,
  scenarioMetrics: Record<string, number>,
  variableDefinitions?: Record<string, VariableDefinition>,
): string {
  const businessProfile = buildBusinessProfile(profile);
  const scenarioContext = buildScenarioContext(
    scenarioMetrics,
    variableDefinitions,
  );
  const sectionContext = buildSectionContext(config.sectionSlug, sectionData);
  const taskInstruction = getSectionPrompt(config.sectionSlug, config.action, profile?.type);

  let prompt = `<business_profile>
${businessProfile}
</business_profile>

<scenario_metrics>
${scenarioContext}
</scenario_metrics>

<current_section slug="${config.sectionSlug}">
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
