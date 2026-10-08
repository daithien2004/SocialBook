import { Module } from '@nestjs/common';
import { ITrendingKeywordCachePort } from '../../domain/interfaces/trending-keyword-cache.port';
import { TrendingKeywordCacheAdapter } from './trending-keyword-cache.adapter';

@Module({
  providers: [
    {
      provide: ITrendingKeywordCachePort,
      useClass: TrendingKeywordCacheAdapter,
    },
  ],
  exports: [ITrendingKeywordCachePort],
})
export class SearchCacheModule {}
