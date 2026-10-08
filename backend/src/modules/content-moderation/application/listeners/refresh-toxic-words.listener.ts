import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IToxicWordRepository } from '@/modules/content-moderation/domain/repositories/toxic-word.repository.interface';
import { updateToxicWordsCache } from '@/modules/content-moderation/domain/utils/vietnamese-profanity';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RefreshToxicWordsListener
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RefreshToxicWordsListener.name);
  private subscriber: Redis | null = null;

  constructor(
    private readonly toxicWordRepository: IToxicWordRepository,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async onApplicationBootstrap() {
    await this.refreshCache();

    // Setup Redis Pub/Sub to sync cache across multiple Node processes
    this.subscriber = this.redis.duplicate();
    await this.subscriber.subscribe('cache-invalidate:toxic-words');
    this.subscriber.on('message', (channel) => {
      if (channel === 'cache-invalidate:toxic-words') {
        this.logger.debug('Received cache-invalidate signal from Redis PubSub');
        this.refreshCache().catch((err) => {
          this.logger.error('Failed to refresh cache on pubsub message', err);
        });
      }
    });
  }

  async onModuleDestroy() {
    if (this.subscriber) {
      await this.subscriber.quit();
    }
  }

  @OnEvent(EventNames.TOXIC_WORDS_UPDATED)
  async handleToxicWordsUpdatedEvent() {
    // Gá»i tá»± lÃ m má»›i local trÆ°á»›c
    await this.refreshCache();
    // PhÃ¡t tÃ­n hiá»‡u cho cÃ¡c process khÃ¡c (worker, backend2, ...) lÃ m má»›i
    this.redis
      .publish('cache-invalidate:toxic-words', 'refresh')
      .catch((err) => {
        this.logger.error('Failed to publish cache invalidate signal', err);
      });
  }

  private async refreshCache() {
    try {
      const words = await this.toxicWordRepository.findAll();

      const mappedWords = words.map((w) => ({
        pattern: w.pattern,
        group: w.group,
      }));

      updateToxicWordsCache(mappedWords);
      this.logger.log(
        `Refreshed in-memory toxic words cache with ${words.length} patterns.`,
      );
    } catch (error) {
      this.logger.error('Failed to refresh toxic words cache', error);
    }
  }
}
