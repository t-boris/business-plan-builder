import { auth } from '@/lib/firebase';
import { createLogger } from '@/lib/logger';

const log = createLogger('ai.proxy');
const DEFAULT_PROJECT_ID = 'my-business-planning';
const DEFAULT_FUNCTIONS_REGION = 'us-central1';
const DEFAULT_FUNCTIONS_EMULATOR_HOST = 'localhost';
const DEFAULT_FUNCTIONS_EMULATOR_PORT = 5001;

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return defaultValue;
}

function parseNumberEnv(value: string | undefined, defaultValue: number): number {
  if (value == null) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

/**
 * Get the base URL for AI proxy endpoints.
 * In dev with emulator enabled: http://localhost:5001/{projectId}/{region}
 * In prod: the Cloud Functions URL (auto-detected from hosting)
 */
function getProxyBaseUrl(): string {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
  const region = DEFAULT_FUNCTIONS_REGION;

  if (import.meta.env.DEV) {
    const useFunctionsEmulator = parseBooleanEnv(
      import.meta.env.VITE_USE_FUNCTIONS_EMULATOR,
      false,
    );
    if (useFunctionsEmulator) {
      const host = import.meta.env.VITE_FUNCTIONS_EMULATOR_HOST || DEFAULT_FUNCTIONS_EMULATOR_HOST;
      const port = parseNumberEnv(
        import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT,
        DEFAULT_FUNCTIONS_EMULATOR_PORT,
      );
      return `http://${host}:${port}/${projectId}/${region}`;
    }
  }

  return `https://${region}-${projectId}.cloudfunctions.net`;
}

export async function proxyFetch<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Not authenticated');

  const url = `${getProxyBaseUrl()}/${endpoint}`;

  log.info('request', { endpoint });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error('request.network_error', { endpoint, url, error: message });
    throw new Error(
      'Unable to reach AI proxy. Start Functions emulator (`npm run emulator`) or disable VITE_USE_FUNCTIONS_EMULATOR.',
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) throw new Error('Authentication required');
    if (response.status === 429) throw new Error('Rate limit reached, please wait a moment');
    log.error('response.error', { endpoint, status: response.status, error: errorText });
    throw new Error(`AI proxy error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
