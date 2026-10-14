import { ReadingRoomConcurrencyError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { withOptimisticRetry } from '@/shared/application/with-optimistic-retry';

describe('withOptimisticRetry', () => {
  it('retries a feature concurrency error and returns the successful attempt', async () => {
    let attempts = 0;

    const result = await withOptimisticRetry(() => {
      attempts += 1;
      if (attempts < 2) {
        return Promise.reject(new ReadingRoomConcurrencyError());
      }
      return Promise.resolve('saved');
    });

    expect(result).toBe('saved');
    expect(attempts).toBe(2);
  });

  it('does not retry a non-concurrency domain error', async () => {
    let attempts = 0;
    const failure = new Error('invalid operation');

    await expect(
      withOptimisticRetry(() => {
        attempts += 1;
        return Promise.reject(failure);
      }),
    ).rejects.toBe(failure);

    expect(attempts).toBe(1);
  });
});
