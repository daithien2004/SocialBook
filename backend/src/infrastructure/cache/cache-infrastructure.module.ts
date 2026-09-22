import { Global, Module } from '@nestjs/common';
import { ICachePort } from '@/shared/domain/cache.port';
import { IBookCachePort } from '@/domain/books/interfaces/book-cache.port';
import { IViewRankingCachePort } from '@/domain/books/interfaces/view-ranking-cache.port';
import { ITrendingKeywordCachePort } from '@/domain/search/interfaces/trending-keyword-cache.port';
import { IPresenceCachePort } from '@/domain/reading-rooms/interfaces/presence-cache.port';
import { TokenRotationPort } from '@/application/ports/token-rotation.port';
import { RedisCacheAdapter } from './redis-cache.adapter';
import { BookCacheAdapter } from './book-cache.adapter';
import { ViewRankingCacheAdapter } from './view-ranking-cache.adapter';
import { TrendingKeywordCacheAdapter } from './trending-keyword-cache.adapter';
import { PresenceCacheAdapter } from './presence-cache.adapter';
import { TokenRotationAdapter } from './token-rotation.adapter';

@Global()
@Module({
  providers: [
    {
      provide: ICachePort,
      useClass: RedisCacheAdapter,
    },
    {
      provide: IBookCachePort,
      useClass: BookCacheAdapter,
    },
    {
      provide: IViewRankingCachePort,
      useClass: ViewRankingCacheAdapter,
    },
    {
      provide: ITrendingKeywordCachePort,
      useClass: TrendingKeywordCacheAdapter,
    },
    {
      provide: IPresenceCachePort,
      useClass: PresenceCacheAdapter,
    },
    {
      provide: TokenRotationPort,
      useClass: TokenRotationAdapter,
    },
  ],
  exports: [
    ICachePort,
    IBookCachePort,
    IViewRankingCachePort,
    ITrendingKeywordCachePort,
    IPresenceCachePort,
    TokenRotationPort,
  ],
})
export class CacheInfrastructureModule {}
