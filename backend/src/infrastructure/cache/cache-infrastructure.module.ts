import { Global, Module } from '@nestjs/common';
import { ICacheService } from '@/domain/shared/interfaces/cache.repository.interface';
import { IBookCacheService } from '@/domain/books/interfaces/book-cache.service.interface';
import { IViewRankingCache } from '@/domain/books/interfaces/view-ranking.cache.interface';
import { ITrendingKeywordCache } from '@/domain/search/interfaces/trending-keyword.cache.interface';
import { IPresenceCache } from '@/domain/reading-rooms/interfaces/presence-cache.interface';
import { RedisCacheService } from './redis-cache.service';
import { BookCacheService } from './book-cache.service';
import { ViewRankingCacheService } from './view-ranking-cache.service';
import { TrendingKeywordCacheService } from './trending-keyword-cache.service';
import { PresenceCacheService } from './presence-cache.service';

@Global()
@Module({
  providers: [
    {
      provide: ICacheService,
      useClass: RedisCacheService,
    },
    {
      provide: IBookCacheService,
      useClass: BookCacheService,
    },
    {
      provide: IViewRankingCache,
      useClass: ViewRankingCacheService,
    },
    {
      provide: ITrendingKeywordCache,
      useClass: TrendingKeywordCacheService,
    },
    {
      provide: IPresenceCache,
      useClass: PresenceCacheService,
    },
  ],
  exports: [
    ICacheService,
    IBookCacheService,
    IViewRankingCache,
    ITrendingKeywordCache,
    IPresenceCache,
  ],
})
export class CacheInfrastructureModule {}
