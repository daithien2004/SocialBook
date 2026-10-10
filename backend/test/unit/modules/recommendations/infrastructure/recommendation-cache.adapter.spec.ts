import { Logger } from '@nestjs/common';
import { ICachePort } from '@/shared/domain/cache.port';
import { RecommendationCacheAdapter } from '@/modules/recommendations/infrastructure/recommendation-cache.adapter';

class CacheFake implements ICachePort {
  deletedKeys: string[] = [];
  setKeys: string[] = [];
  deleteError: Error | undefined;
  setError: Error | undefined;

  get(_key: string): Promise<null> {
    return Promise.resolve(null);
  }

  set(_key: string, _value: unknown, _ttlSeconds?: number): Promise<void> {
    if (this.setError) {
      return Promise.reject(this.setError);
    }
    this.setKeys.push(_key);
    return Promise.resolve();
  }

  setIfNotExists(
    _key: string,
    _value: string,
    _ttlSeconds: number,
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  del(key: string): Promise<void> {
    if (this.deleteError) {
      return Promise.reject(this.deleteError);
    }
    this.deletedKeys.push(key);
    return Promise.resolve();
  }

  reset(): Promise<void> {
    return Promise.resolve();
  }
}

describe('RecommendationCacheAdapter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deletes the recommendation cache key for a user', async () => {
    const cache = new CacheFake();
    const adapter = new RecommendationCacheAdapter(cache);

    await adapter.clear('user-123');

    expect(cache.deletedKeys).toEqual(['recommendation:user:user-123']);
  });

  it('sets the recommendation cache key for a user', async () => {
    const cache = new CacheFake();
    const adapter = new RecommendationCacheAdapter(cache);

    await adapter.set('user-123', {
      analysis: {
        favoriteGenres: [],
        readingPace: 'medium',
        preferredLength: 'medium',
        themes: [],
      },
      recommendations: [],
    });

    expect(cache.setKeys).toEqual(['recommendation:user:user-123']);
  });

  it('logs cache set failures without rejecting the caller', async () => {
    const cache = new CacheFake();
    cache.setError = new Error('Redis unavailable');
    const adapter = new RecommendationCacheAdapter(cache);
    const warning = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await expect(
      adapter.set('user-123', {
        analysis: {
          favoriteGenres: [],
          readingPace: 'medium',
          preferredLength: 'medium',
          themes: [],
        },
        recommendations: [],
      }),
    ).resolves.toBeUndefined();

    expect(warning).toHaveBeenCalledWith(
      'Failed to set recommendation cache for user user-123: Redis unavailable',
    );
  });

  it('logs cache deletion failures without rejecting the caller', async () => {
    const cache = new CacheFake();
    cache.deleteError = new Error('Redis unavailable');
    const adapter = new RecommendationCacheAdapter(cache);
    const warning = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await expect(adapter.clear('user-123')).resolves.toBeUndefined();

    expect(warning).toHaveBeenCalledWith(
      'Failed to clear recommendation cache for user user-123: Redis unavailable',
    );
  });
});
