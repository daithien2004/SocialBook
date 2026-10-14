import { Module } from '@nestjs/common';
import { TrendingKeywordCachePort } from '../../application/ports/trending-keyword-cache.port';
import { TrendingKeywordCacheAdapter } from './trending-keyword-cache.adapter';

@Module({
  providers: [
    {
      provide: TrendingKeywordCachePort,
      useClass: TrendingKeywordCacheAdapter,
    },
  ],
  exports: [TrendingKeywordCachePort],
})
export class SearchCacheModule {}
