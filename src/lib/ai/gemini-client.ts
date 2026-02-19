import { GoogleGenAI } from '@google/genai';
import { createLogger } from '@/lib/logger';

const log = createLogger('ai.gemini');
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export const isAiAvailable = !!apiKey;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL = 'gemini-3-flash-preview';

/**
 * Generate free-text content using Gemini.
 */
export async function generateSectionContent(
  prompt: string,
  systemInstruction: string,
): Promise<string> {
  if (!ai) throw new Error('Gemini API key not configured');

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 1.0,
        maxOutputTokens: 8192,
      },
    });

    return response.text ?? '';
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('429')) {
      log.warn('rate-limited', { action: 'generateSectionContent' });
      throw new Error('Rate limit reached, please wait a moment');
    }
    log.error('request.failed', {
      action: 'generateSectionContent',
      model: MODEL,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      error instanceof Error ? error.message : 'AI generation failed',
    );
  }
}

/**
 * Generate structured JSON content using Gemini with a JSON schema.
 */
export async function generateStructuredContent<T>(
  prompt: string,
  systemInstruction: string,
  jsonSchema: object,
): Promise<T> {
  if (!ai) throw new Error('Gemini API key not configured');

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 1.0,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: jsonSchema,
      },
    });

    return JSON.parse(response.text ?? '{}') as T;
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('429')) {
      log.warn('rate-limited', { action: 'generateStructuredContent' });
      throw new Error('Rate limit reached, please wait a moment');
    }
    log.error('request.failed', {
      action: 'generateStructuredContent',
      model: MODEL,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      error instanceof Error ? error.message : 'AI generation failed',
    );
  }
}
