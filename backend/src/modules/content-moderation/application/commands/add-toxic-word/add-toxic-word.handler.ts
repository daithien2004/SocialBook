import { CommandHandler } from '@nestjs/cqrs';
import { AddToxicWordCommand } from './add-toxic-word.command';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IToxicWordRepository } from '@/modules/content-moderation/domain/repositories/toxic-word.repository.interface';
import { ToxicWord } from '@/modules/content-moderation/domain/entities/toxic-word.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { VietnameseRegexBuilder } from '@/modules/content-moderation/domain/utils/vietnamese-regex-builder';
import { EventNames } from '@/common/constants/event-names.constant';

@CommandHandler(AddToxicWordCommand)
export class AddToxicWordHandler {
  constructor(
    private readonly toxicWordRepository: IToxicWordRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: AddToxicWordCommand): Promise<ToxicWord> {
    const isRegex = /[[\]\\^$|?*+]/.test((command as any).pattern);
    const finalPattern = isRegex
      ? (command as any).pattern
      : VietnameseRegexBuilder.buildRegex((command as any).pattern);

    const exists = await this.toxicWordRepository.existsByPattern(finalPattern);
    if (exists) {
      throw new BadRequestDomainException(
        'Từ khóa hoặc pattern này đã tồn tại.',
      );
    }

    const toxicWord = ToxicWord.create({
      id: this.idGenerator.generate(),
      pattern: finalPattern,
      group: (command as any).group,
      originalWord: (command as any).pattern,
    });

    const savedWord = await this.toxicWordRepository.create(toxicWord);

    // Notify listeners to update cache
    this.eventEmitter.emit(EventNames.TOXIC_WORDS_UPDATED);

    return savedWord;
  }
}
