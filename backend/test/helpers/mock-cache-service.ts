import { ICachePort } from '@/domain/shared/interfaces/cache.service.interface';
import { IBookCachePort } from '@/domain/books/interfaces/book-cache.port';

export function createMockCacheService(): jest.Mocked<ICachePort> {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };
}

export function createMockBookCacheService(): jest.Mocked<IBookCachePort> {
  return {
    getDetail: jest.fn(),
    setDetail: jest.fn(),
    invalidateDetail: jest.fn(),
  };
}
