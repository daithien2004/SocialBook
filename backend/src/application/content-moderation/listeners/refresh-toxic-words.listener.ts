import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IToxicWordRepository } from '@/domain/content-moderation/repositories/toxic-word.repository.interface';
import { updateToxicWordsCache } from '@/domain/content-moderation/utils/vietnamese-profanity';
import { EventNames } from '@/common/constants/event-names.constant';
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
    // Gọi tự làm mới local trước
    await this.refreshCache();
    // Phát tín hiệu cho các process khác (worker, backend2, ...) làm mới
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
