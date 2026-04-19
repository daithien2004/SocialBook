import { Global, Module } from '@nestjs/common';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';
import { RedisCacheService } from './redis-cache.service';

import { BookCacheService } from './books/book-cache.service';
import { BOOK_CACHE_SERVICE } from '@/domain/books/cache/book-cache.service.interface';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_SERVICE,
      useClass: RedisCacheService,
    },
    {
      provide: BOOK_CACHE_SERVICE,
      useClass: BookCacheService,
    },
  ],
  exports: [CACHE_SERVICE, BOOK_CACHE_SERVICE],
})
export class CacheInfrastructureModule {}
