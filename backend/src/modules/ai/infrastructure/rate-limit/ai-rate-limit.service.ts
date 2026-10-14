import { Injectable, Logger } from '@nestjs/common';
import { ICachePort } from '@/shared/domain/cache.port';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { AIRateLimitConfigPort } from '../../application/ports/ai-rate-limit-config.port';
import type { AIRateLimitConfigReadModel } from '../../application/read-models/ai-rate-limit-config.read-model';

export type AIRateLimitConfig = AIRateLimitConfigReadModel;

const CACHE_KEY = 'config:rate_limit_ai';
const LEGACY_CACHE_KEY = 'config:rate_limit_gemini';
const CONFIG_KEY = 'rate_limit_ai';
const LEGACY_CONFIG_KEY = 'rate_limit_gemini';
const FALLBACK: AIRateLimitConfig = {
  guestLimit: 2,
  userLimit: 5,
  ttl: 60_000,
  blockDuration: 60_000,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toPartialConfig(value: unknown): Partial<AIRateLimitConfig> | null {
  if (!isRecord(value)) return null;

  const config: Partial<AIRateLimitConfig> = {};
  if (typeof value.guestLimit === 'number') {
    config.guestLimit = value.guestLimit;
  }
  if (typeof value.userLimit === 'number') {
    config.userLimit = value.userLimit;
  }
  if (typeof value.ttl === 'number') config.ttl = value.ttl;
  if (typeof value.blockDuration === 'number') {
    config.blockDuration = value.blockDuration;
  }
  return config;
}

@Injectable()
export class RateLimitConfigService extends AIRateLimitConfigPort {
  private readonly logger = new Logger(RateLimitConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: ICachePort,
  ) {
    super();
  }

  async get(): Promise<AIRateLimitConfig> {
    const cached = await this.cacheService.get<AIRateLimitConfig>(CACHE_KEY);
    if (cached) return cached;

    const doc = await this.readConfig(CONFIG_KEY);
    if (doc) return this.cacheAndReturn(doc);

    const migrated = await this.migrateLegacyConfig();
    if (migrated) return migrated;

    return FALLBACK;
  }

  async update(data: Partial<AIRateLimitConfig>): Promise<AIRateLimitConfig> {
    await this.prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: data },
      update: { value: data },
    });

    await this.cacheService.del(CACHE_KEY);

    return this.get();
  }

  private async readConfig(
    key: string,
  ): Promise<Partial<AIRateLimitConfig> | null> {
    try {
      const document = await this.prisma.systemConfig.findUnique({
        where: { key },
      });
      return document ? toPartialConfig(document.value) : null;
    } catch (error) {
      this.logger.error(
        `Failed to read config from PostgreSQL: ${getErrorMessage(error)}`,
      );
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
      const legacyConfig = await this.readConfig(LEGACY_CONFIG_KEY);
      if (!legacyConfig) return null;

      await this.prisma.systemConfig.upsert({
        where: { key: CONFIG_KEY },
        create: { key: CONFIG_KEY, value: legacyConfig },
        update: { value: legacyConfig },
      });
      await this.prisma.systemConfig.deleteMany({
        where: { key: LEGACY_CONFIG_KEY },
      });
      await this.cacheService.del(LEGACY_CACHE_KEY);

      this.logger.log(
        'Migrated legacy rate_limit_gemini config to rate_limit_ai',
      );
      return await this.cacheAndReturn(legacyConfig);
    } catch (error) {
      this.logger.error(
        `Failed to migrate legacy rate limit config: ${getErrorMessage(error)}`,
      );
      return null;
    }
  }
}
