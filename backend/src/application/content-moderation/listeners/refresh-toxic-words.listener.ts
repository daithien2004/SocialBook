import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IToxicWordRepository } from '@/domain/content-moderation/repositories/toxic-word.repository.interface';
import { updateToxicWordsCache } from '@/domain/content-moderation/utils/vietnamese-profanity';

@Injectable()
export class RefreshToxicWordsListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(RefreshToxicWordsListener.name);

  constructor(private readonly toxicWordRepository: IToxicWordRepository) {}

  async onApplicationBootstrap() {
    await this.refreshCache();
  }

  @OnEvent('toxic-words.updated')
  async handleToxicWordsUpdatedEvent() {
    await this.refreshCache();
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
