import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ICacheService } from '@/domain/shared/cache/cache.service.interface';

@Injectable()
export class RedisCacheService implements ICacheService {
    private readonly logger = new Logger(RedisCacheService.name);

    constructor(@InjectRedis() private readonly redis: Redis) { }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);
            return value ? (JSON.parse(value) as T) : null;
        } catch (error) {
            this.logger.error(`[Cache] GET failed for key "${key}": ${(error as Error).message}`);
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.redis.setex(key, ttlSeconds, serialized);
            } else {
                await this.redis.set(key, serialized);
            }
        } catch (error) {
            this.logger.error(`[Cache] SET failed for key "${key}": ${(error as Error).message}`);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            this.logger.error(`[Cache] DEL failed for key "${key}": ${(error as Error).message}`);
        }
    }

    async clear(pattern: string): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            this.logger.error(`[Cache] CLEAR failed for pattern "${pattern}": ${(error as Error).message}`);
        }
    }

    async wrap<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) return cached;

        const value = await factory();
        await this.set(key, value, ttlSeconds);
        return value;
    }
}
