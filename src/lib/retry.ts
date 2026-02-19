import { createLogger } from '@/lib/logger';

const log = createLogger('retry');

export interface RetryOptions {
  maxRetries?: number;  // default: 3
  baseDelay?: number;   // default: 1000ms
  maxDelay?: number;    // default: 10000ms
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options ?? {};

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
        log.warn('retrying', { attempt: attempt + 1, maxRetries, delay, error: (err as Error).message });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
