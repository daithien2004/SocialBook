import { Global, Module } from '@nestjs/common';
import { CACHE_SERVICE_TOKEN } from '@/domain/shared/interfaces/cache.service.interface';
import { BOOK_CACHE_SERVICE_TOKEN } from '@/domain/books/interfaces/book-cache.service.interface';
import { VIEW_RANKING_CACHE_TOKEN } from '@/domain/books/interfaces/view-ranking.cache.interface';
import { TRENDING_KEYWORD_CACHE_TOKEN } from '@/domain/search/interfaces/trending-keyword.cache.interface';
import { PRESENCE_CACHE_TOKEN } from '@/domain/reading-rooms/interfaces/presence-cache.interface';
import { RedisCacheService } from './redis-cache.service';
import { BookCacheService } from './book-cache.service';
import { ViewRankingCacheService } from './view-ranking-cache.service';
import { TrendingKeywordCacheService } from './trending-keyword-cache.service';
import { PresenceCacheService } from './presence-cache.service';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_SERVICE_TOKEN,
      useClass: RedisCacheService,
    },
    {
      provide: BOOK_CACHE_SERVICE_TOKEN,
      useClass: BookCacheService,
    },
    {
      provide: VIEW_RANKING_CACHE_TOKEN,
      useClass: ViewRankingCacheService,
    },
    {
      provide: TRENDING_KEYWORD_CACHE_TOKEN,
      useClass: TrendingKeywordCacheService,
    },
    {
      provide: PRESENCE_CACHE_TOKEN,
      useClass: PresenceCacheService,
    },
  ],
  exports: [
    CACHE_SERVICE_TOKEN,
    BOOK_CACHE_SERVICE_TOKEN,
    VIEW_RANKING_CACHE_TOKEN,
    TRENDING_KEYWORD_CACHE_TOKEN,
    PRESENCE_CACHE_TOKEN,
  ],
})
export class CacheInfrastructureModule {}
