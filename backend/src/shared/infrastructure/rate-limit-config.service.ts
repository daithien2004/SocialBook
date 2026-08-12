import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ICachePort } from '@/domain/shared/interfaces/cache.port';

export interface AIRateLimitConfig {
  guestLimit: number;
  userLimit: number;
  ttl: number;
  blockDuration: number;
}

const CACHE_KEY = 'config:rate_limit_ai';
const LEGACY_CACHE_KEY = 'config:rate_limit_gemini';
const FALLBACK: AIRateLimitConfig = {
  guestLimit: 2,
  userLimit: 5,
  ttl: 60_000,
  blockDuration: 60_000,
};

@Injectable()
export class RateLimitConfigService {
  private readonly logger = new Logger(RateLimitConfigService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cacheService: ICachePort,
  ) {}

  async getAIConfig(): Promise<AIRateLimitConfig> {
    const cached = await this.cacheService.get<AIRateLimitConfig>(CACHE_KEY);
    if (cached) return cached;

    const doc = await this.readConfig('rate_limit_ai');
    if (doc) return this.cacheAndReturn(doc);

    const migrated = await this.migrateLegacyConfig();
    if (migrated) return migrated;

    return FALLBACK;
  }

  async updateAIConfig(
    data: Partial<AIRateLimitConfig>,
  ): Promise<AIRateLimitConfig> {
    const update: Record<string, unknown> = { ...data, updatedAt: new Date() };

    await this.connection
      .collection('configs')
      .updateOne({ key: 'rate_limit_ai' }, { $set: update }, { upsert: true });

    await this.cacheService.del(CACHE_KEY);

    return this.getAIConfig();
  }

  private async readConfig(
    key: string,
  ): Promise<Partial<AIRateLimitConfig> | null> {
    try {
      return (await this.connection.collection('configs').findOne({
        key,
      })) as Partial<AIRateLimitConfig> | null;
    } catch (error) {
      this.logger.error(`Failed to read config from MongoDB: ${error}`);
      return null;
    }
  }

  private normalizeConfig(doc: Partial<AIRateLimitConfig>): AIRateLimitConfig {
    return {
      guestLimit: doc.guestLimit ?? FALLBACK.guestLimit,
      userLimit: doc.userLimit ?? FALLBACK.userLimit,
      ttl: doc.ttl ?? FALLBACK.ttl,
      blockDuration: doc.blockDuration ?? FALLBACK.blockDuration,
    };
  }

  private async cacheAndReturn(
    doc: Partial<AIRateLimitConfig>,
  ): Promise<AIRateLimitConfig> {
    const config = this.normalizeConfig(doc);
    await this.cacheService.set(CACHE_KEY, config, 30);
    return config;
  }

  private async migrateLegacyConfig(): Promise<AIRateLimitConfig | null> {
    try {
      const legacyDoc = (await this.connection
        .collection('configs')
        .findOne({ key: 'rate_limit_gemini' })) as {
        guestLimit?: number;
        userLimit?: number;
        ttl?: number;
        blockDuration?: number;
      } | null;
      if (!legacyDoc) return null;

      const legacyConfig: Partial<AIRateLimitConfig> = {
        guestLimit: legacyDoc.guestLimit,
        userLimit: legacyDoc.userLimit,
        ttl: legacyDoc.ttl,
        blockDuration: legacyDoc.blockDuration,
      };

      await this.connection
        .collection('configs')
        .updateOne(
          { key: 'rate_limit_ai' },
          { $set: legacyConfig },
          { upsert: true },
        );
      await this.connection.collection('configs').deleteOne({
        key: 'rate_limit_gemini',
      });
      await this.cacheService.del(LEGACY_CACHE_KEY);

      this.logger.log(
        'Migrated legacy rate_limit_gemini config to rate_limit_ai',
      );
      return this.cacheAndReturn(legacyConfig);
    } catch (error) {
      this.logger.error(`Failed to migrate legacy rate limit config: ${error}`);
      return null;
    }
  }
}
