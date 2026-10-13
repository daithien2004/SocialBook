import { ConcurrencyException } from '@/shared/domain/common-exceptions';

/** Retries optimistic conflicts; the callback must reload state on every attempt. */
export async function withOptimisticRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('maxAttempts must be a positive integer');
  }

  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      if (!(e instanceof ConcurrencyException) || i >= maxAttempts) {
        throw e;
      }
      await new Promise((r) => setTimeout(r, 20 * i + Math.random() * 30));
    }
  }
}
