import { ICacheService } from '@/domain/shared/interfaces/cache.service.interface';
import { IBookCacheService } from '@/domain/books/interfaces/book-cache.service.interface';

export function createMockCacheService(): jest.Mocked<ICacheService> {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };
}

export function createMockBookCacheService(): jest.Mocked<IBookCacheService> {
  return {
    getDetail: jest.fn(),
    setDetail: jest.fn(),
    invalidateDetail: jest.fn(),
  };
}
