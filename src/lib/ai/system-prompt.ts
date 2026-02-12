import type { BusinessProfile } from '@/types';
import { INDUSTRY_CONFIGS } from './industry-config';

/**
 * Build a dynamic system prompt tailored to the business type and profile.
 * Replaces the old static SYSTEM_INSTRUCTION with a context-aware prompt.
 */
export function buildSystemPrompt(profile: BusinessProfile): string {
  const config = INDUSTRY_CONFIGS[profile.type];

  let prompt = `${config.role}

BUSINESS CONTEXT:
Name: ${profile.name}
Type: ${profile.type}
Industry: ${profile.industry}
Location: ${profile.location}
Description: ${profile.description}`;

  if (config.vocabulary.length > 0) {
    prompt += `

DOMAIN EXPERTISE:
Use industry-standard terminology where appropriate: ${config.vocabulary.join(', ')}`;
  }

  prompt += `

TONE:
- Professional but approachable
- Data-driven: reference specific numbers from the provided metrics
- Concise: use bullet points and short paragraphs
- Actionable: every recommendation should be implementable

CONSTRAINTS:
- Never invent financial numbers. Use ONLY the data provided in scenario metrics.
- When data is missing, explicitly say "Data needed:" followed by what is required.
- All monetary values in ${profile.currency}.
- Reference actual values (e.g., "$50k/mo" not "your revenue").

OUTPUT FORMAT:
- Return structured JSON matching the provided schema when a schema is specified.
- Use markdown formatting within text fields (bold, bullets, headers).
- Keep individual text fields under 500 words unless specifically asked to expand.`;

  return prompt;
}

