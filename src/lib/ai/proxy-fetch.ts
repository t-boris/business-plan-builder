import { auth } from '@/lib/firebase';
import { createLogger } from '@/lib/logger';

const log = createLogger('ai.proxy');

/**
 * Get the base URL for AI proxy endpoints.
 * In dev (emulator): http://localhost:5001/{projectId}/{region}
 * In prod: the Cloud Functions URL (auto-detected from hosting)
 */
function getProxyBaseUrl(): string {
  if (import.meta.env.DEV) {
    // Functions emulator — project ID must match .firebaserc
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'my-business-planning';
    return `http://localhost:5001/${projectId}/us-central1`;
  }
  // In production, use the full Cloud Functions URL
  return `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;
}

export async function proxyFetch<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');

  const url = `${getProxyBaseUrl()}/${endpoint}`;

  log.info('request', { endpoint });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) throw new Error('Authentication required');
    if (response.status === 429) throw new Error('Rate limit reached, please wait a moment');
    log.error('response.error', { endpoint, status: response.status, error: errorText });
    throw new Error(`AI proxy error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
