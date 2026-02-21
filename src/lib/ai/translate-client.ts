import { proxyFetch } from './proxy-fetch';

interface TranslateResponse {
  translated: Record<string, string>;
}

/**
 * Translate a batch of text fields via the AI proxy.
 * Keys are preserved; values are translated to targetLanguage.
 */
export async function translateTexts(
  texts: Record<string, string>,
  targetLanguage: string,
): Promise<Record<string, string>> {
  const { translated } = await proxyFetch<TranslateResponse>('aiTranslateSection', {
    texts,
    targetLanguage,
  });
  return translated;
}
