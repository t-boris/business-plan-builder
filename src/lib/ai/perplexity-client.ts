import { createLogger } from '@/lib/logger';

const log = createLogger('ai.perplexity');
const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY as string | undefined;

export const isPerplexityAvailable = !!apiKey;

interface PerplexityResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  citations?: string[];
}

export async function searchPerplexity(
  query: string,
): Promise<{ content: string; citations: string[] }> {
  if (!apiKey) throw new Error('Perplexity API key not configured');

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content:
              'You are a market research analyst. Return factual demographic and market data with sources. Be precise and data-driven.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        log.warn('rate-limited', { action: 'searchPerplexity' });
        throw new Error('Rate limit reached, please wait a moment');
      }
      log.error('request.failed', {
        action: 'searchPerplexity',
        status: response.status,
        error: errorText,
      });
      throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const citations = data.citations ?? [];

    return { content, citations };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Perplexity')) {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith('Rate limit')) {
      throw error;
    }
    log.error('request.failed', {
      action: 'searchPerplexity',
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      error instanceof Error ? error.message : 'Perplexity search failed',
    );
  }
}
