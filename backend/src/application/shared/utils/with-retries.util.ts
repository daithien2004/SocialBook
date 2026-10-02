import { ConflictDomainException } from '@/shared/domain/common-exceptions';

export async function withRetries<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ConflictDomainException && attempt < maxRetries) {
        attempt++;
        continue;
      }
      throw error;
    }
  }
}
