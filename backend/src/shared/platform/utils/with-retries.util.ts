import { ConcurrencyException } from '@/shared/domain/common-exceptions';

export async function withOptimisticRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      if (!(e instanceof ConcurrencyException) || i >= attempts) {
        throw e;
      }
      await new Promise((r) => setTimeout(r, 20 * i + Math.random() * 30));
    }
  }
}

export const withRetries = withOptimisticRetry;
