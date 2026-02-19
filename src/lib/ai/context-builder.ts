import type { SectionSlug, BusinessProfile, VariableDefinition } from '@/types';
import type { ScenarioAssumption, ScenarioStatus } from '@/types/scenario';
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

/** Build an XML-tagged context block for v2 scenario data (assumptions, variants, horizon, status). */
export function buildScenarioV2Context(config: {
  scenarioName: string;
  status: ScenarioStatus;
  horizonMonths: number;
  assumptions: ScenarioAssumption[];
  variantRefs: Record<string, string>;
  variantNames?: Record<string, string>;
}): string {
  const lines: string[] = [];
  lines.push('<active_scenario>');
  lines.push(`  <name>${config.scenarioName}</name>`);
  lines.push(`  <status>${config.status}</status>`);
  lines.push(`  <horizon>${config.horizonMonths} months</horizon>`);

  if (config.assumptions.length > 0) {
    lines.push('');
    lines.push('  <assumptions>');
    for (const a of config.assumptions) {
      lines.push(`    - ${a.label}: ${a.value}`);
    }
    lines.push('  </assumptions>');
  }

  const variantEntries = Object.entries(config.variantRefs);
  if (variantEntries.length > 0) {
    lines.push('');
    lines.push('  <section_variants>');
    for (const [slug] of variantEntries) {
      const displayName = config.variantNames?.[slug];
      const label = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (displayName) {
        lines.push(`    - ${label}: using variant "${displayName}"`);
      } else {
        lines.push(`    - ${label}: using variant`);
      }
    }
    lines.push('  </section_variants>');
  }

  lines.push('</active_scenario>');
  return lines.join('\n');
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
    scenarioV2Context?: string;
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
</scenario_metrics>`;

  if (config.scenarioV2Context) {
    prompt += `\n\n${config.scenarioV2Context}`;
  }

  prompt += `\n\n<current_section slug="${config.sectionSlug}">
${sectionContext}
</current_section>

<task>
${taskInstruction}`;

  if (config.scenarioV2Context) {
    prompt += '\n\nConsider the active scenario context, assumptions, and any section variants when generating content.';
  }

  if (config.userInstruction) {
    prompt += `\n\nAdditional instruction: ${config.userInstruction}`;
  }

  prompt += '\n</task>';

  return prompt;
}
