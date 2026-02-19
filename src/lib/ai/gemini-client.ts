import { proxyFetch } from './proxy-fetch';

// AI availability is determined server-side; the proxy handles "not configured" errors
export const isAiAvailable = true;

/**
 * Generate free-text content using Gemini via the AI proxy.
 */
export async function generateSectionContent(
  prompt: string,
  systemInstruction: string,
): Promise<string> {
  const result = await proxyFetch<{ text: string }>('aiGeminiGenerate', {
    prompt,
    systemInstruction,
  });
  return result.text;
}

/**
 * Generate structured JSON content using Gemini via the AI proxy.
 */
export async function generateStructuredContent<T>(
  prompt: string,
  systemInstruction: string,
  jsonSchema: object,
): Promise<T> {
  const result = await proxyFetch<{ data: T }>('aiGeminiStructured', {
    prompt,
    systemInstruction,
    jsonSchema,
  });
  return result.data;
}
