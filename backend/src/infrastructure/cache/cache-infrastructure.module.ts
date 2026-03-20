import { Global, Module } from '@nestjs/common';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';
import { RedisCacheService } from './redis-cache.service';

/**
 * Global module — import một lần ở AppModule, dùng được ở mọi nơi.
 * Bind ICacheService → RedisCacheService qua DI token CACHE_SERVICE.
 */
@Global()
@Module({
    providers: [
        {
            provide: CACHE_SERVICE,
            useClass: RedisCacheService,
        },
    ],
    exports: [CACHE_SERVICE],
})
export class CacheInfrastructureModule { }
