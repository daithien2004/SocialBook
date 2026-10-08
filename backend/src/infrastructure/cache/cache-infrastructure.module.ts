import { Global, Module } from '@nestjs/common';
import { ICachePort } from '@/shared/domain/cache.port';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { IViewRankingCachePort } from '@/modules/books/domain/books/interfaces/view-ranking-cache.port';
import { ITrendingKeywordCachePort } from '@/modules/search/domain';
import { TokenRotationPort } from '@/modules/auth/application/public-api';
import { RedisCacheAdapter } from './redis-cache.adapter';
import { BookCacheAdapter } from './book-cache.adapter';
import { ViewRankingCacheAdapter } from './view-ranking-cache.adapter';
import { TrendingKeywordCacheAdapter } from './trending-keyword-cache.adapter';
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
      provide: TokenRotationPort,
      useClass: TokenRotationAdapter,
    },
  ],
  exports: [
    ICachePort,
    IBookCachePort,
    IViewRankingCachePort,
    ITrendingKeywordCachePort,
    TokenRotationPort,
  ],
})
export class CacheInfrastructureModule {}
