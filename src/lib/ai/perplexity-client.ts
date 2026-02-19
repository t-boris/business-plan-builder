import { proxyFetch } from './proxy-fetch';

// Perplexity availability is determined server-side; the proxy handles "not configured" errors
export const isPerplexityAvailable = true;

/**
 * Search for market research data using Perplexity via the AI proxy.
 */
export async function searchPerplexity(
  query: string,
): Promise<{ content: string; citations: string[] }> {
  return proxyFetch<{ content: string; citations: string[] }>('aiPerplexitySearch', {
    query,
  });
}
