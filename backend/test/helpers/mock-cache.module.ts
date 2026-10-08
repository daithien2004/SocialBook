import { Global, Module } from '@nestjs/common';
import { ICachePort } from '@/shared/domain/cache.port';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { IViewRankingCachePort } from '@/modules/books/domain/books/interfaces/view-ranking-cache.port';
import { IMediaPort } from '@/modules/media/domain/media.port';
import { ITrendingKeywordCachePort } from '@/modules/search/domain';
import {
  createMockCacheService,
  createMockBookCacheService,
  createMockViewRankingCache,
} from './mock-cache-service';

const createMockTrendingKeywordCache =
  (): jest.Mocked<ITrendingKeywordCachePort> => ({
    recordSearch: jest.fn().mockResolvedValue(undefined),
    getTrendingKeywords: jest.fn().mockResolvedValue([]),
  });

const createMockMediaPort = (): jest.Mocked<IMediaPort> => ({
  uploadImage: jest.fn().mockResolvedValue('https://mock/image.jpg'),
  uploadMultipleImages: jest
    .fn()
    .mockResolvedValue(['https://mock/image-1.jpg']),
  deleteImage: jest.fn().mockResolvedValue(undefined),
  deleteMultipleImages: jest.fn().mockResolvedValue(undefined),
  uploadAudio: jest.fn().mockResolvedValue('https://mock/audio.mp3'),
});

@Global()
@Module({
  providers: [
    { provide: ICachePort, useValue: createMockCacheService() },
    { provide: IBookCachePort, useValue: createMockBookCacheService() },
    { provide: IViewRankingCachePort, useValue: createMockViewRankingCache() },
    { provide: IMediaPort, useValue: createMockMediaPort() },
    {
      provide: ITrendingKeywordCachePort,
      useValue: createMockTrendingKeywordCache(),
    },
  ],
  exports: [
    ICachePort,
    IBookCachePort,
    IViewRankingCachePort,
    IMediaPort,
    ITrendingKeywordCachePort,
  ],
})
export class MockCacheModule {}
