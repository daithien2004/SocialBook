import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CacheService } from '@/shared/cache/cache.service';

export interface GeminiRateLimitConfig {
  guestLimit: number;
  userLimit: number;
  ttl: number;
  blockDuration: number;
}

const CACHE_KEY = 'config:rate_limit_gemini';
const FALLBACK: GeminiRateLimitConfig = {
  guestLimit: 2,
  userLimit: 10,
  ttl: 60_000,
  blockDuration: 60_000,
};

@Injectable()
export class RateLimitConfigService {
  private readonly logger = new Logger(RateLimitConfigService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cacheService: CacheService,
  ) {}

  async getGeminiConfig(): Promise<GeminiRateLimitConfig> {
    const cached =
      await this.cacheService.get<GeminiRateLimitConfig>(CACHE_KEY);
    if (cached) return cached;

    try {
      const doc = await this.connection
        .collection('configs')
        .findOne({ key: 'rate_limit_gemini' });

      if (doc) {
        const raw = doc as unknown as Partial<GeminiRateLimitConfig>;
        const config: GeminiRateLimitConfig = {
          guestLimit: raw.guestLimit ?? FALLBACK.guestLimit,
          userLimit: raw.userLimit ?? FALLBACK.userLimit,
          ttl: raw.ttl ?? FALLBACK.ttl,
          blockDuration: raw.blockDuration ?? FALLBACK.blockDuration,
        };
        await this.cacheService.set(CACHE_KEY, config, 30);
        return config;
      }
    } catch (error) {
      this.logger.error(`Failed to read config from MongoDB: ${error}`);
    }

    return FALLBACK;
  }

  async updateGeminiConfig(
    data: Partial<GeminiRateLimitConfig>,
  ): Promise<GeminiRateLimitConfig> {
    const update: Record<string, unknown> = { ...data, updatedAt: new Date() };

    await this.connection
      .collection('configs')
      .updateOne(
        { key: 'rate_limit_gemini' },
        { $set: update },
        { upsert: true },
      );

    await this.cacheService.del(CACHE_KEY);

    return this.getGeminiConfig();
  }
}
