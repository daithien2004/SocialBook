import { ICachePort } from '@/shared/domain/cache.port';
import { IBookCachePort } from '@/domain/books/interfaces/book-cache.port';
import { IViewRankingCachePort } from '@/domain/books/interfaces/view-ranking-cache.port';

export function createMockCacheService(): jest.Mocked<ICachePort> {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    setIfNotExists: jest.fn().mockResolvedValue(false),
    del: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockBookCacheService(): jest.Mocked<IBookCachePort> {
  return {
    getDetail: jest.fn().mockResolvedValue(null),
    setDetail: jest.fn().mockResolvedValue(undefined),
    invalidateDetail: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockViewRankingCache(): jest.Mocked<IViewRankingCachePort> {
  return {
    recordView: jest.fn().mockResolvedValue(undefined),
    getTopBookIds: jest.fn().mockResolvedValue([]),
  };
}
