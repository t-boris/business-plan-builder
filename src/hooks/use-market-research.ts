import { useState, useCallback } from 'react';
import { searchPerplexity } from '@/lib/ai/perplexity-client';

interface MarketResearchState {
  status: 'idle' | 'loading' | 'done' | 'error';
  result: { content: string; citations: string[] } | null;
  error: string | null;
}

const initialState: MarketResearchState = {
  status: 'idle',
  result: null,
  error: null,
};

export function useMarketResearch() {
  const [state, setState] = useState<MarketResearchState>(initialState);

  const research = useCallback(
    async (zipCodes: string[], businessDescription: string) => {
      if (zipCodes.length === 0) {
        setState({
          status: 'error',
          result: null,
          error: 'Please add at least one zip code',
        });
        return;
      }

      setState({ status: 'loading', result: null, error: null });

      const contextLine = businessDescription
        ? `for a business described as: "${businessDescription}"`
        : 'for the local market';

      const query = `Research the following zip codes: ${zipCodes.join(', ')}.
For the combined area, provide the following using these EXACT labels on their own lines:

AREA: [city/county name]
POPULATION: [number]
MEDIAN INCOME: $[number]
TOTAL ADDRESSABLE MARKET: $[dollar value of the total market ${contextLine}]
SERVICEABLE ADDRESSABLE MARKET: $[subset of TAM reachable by this business model]
SERVICEABLE OBTAINABLE MARKET: $[realistic obtainable market share in year 1-2]
TAM METHODOLOGY: [how TAM was calculated]
SAM METHODOLOGY: [how SAM was derived from TAM]
SOM METHODOLOGY: [how SOM was estimated]

Then add a "Competitors" section listing key competitors in this area ${contextLine}.

Use real census/demographic data. Be precise with numbers.`;

      try {
        const result = await searchPerplexity(query);
        setState({ status: 'done', result, error: null });
      } catch (error: unknown) {
        setState({
          status: 'error',
          result: null,
          error:
            error instanceof Error ? error.message : 'Research failed',
        });
      }
    },
    [],
  );

  const dismiss = useCallback(() => {
    setState(initialState);
  }, []);

  return { state, research, dismiss };
}
