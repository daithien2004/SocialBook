import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IToxicWordRepository } from '@/domain/content-moderation/repositories/toxic-word.repository.interface';
import { ToxicWord } from '@/domain/content-moderation/entities/toxic-word.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { VietnameseRegexBuilder } from '@/domain/content-moderation/utils/vietnamese-regex-builder';

export interface AddToxicWordCommand {
  pattern: string;
  group: string;
}

@Injectable()
export class AddToxicWordUseCase {
  constructor(
    private readonly toxicWordRepository: IToxicWordRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: AddToxicWordCommand): Promise<ToxicWord> {
    const isRegex = /[[\]\\^$|?*+]/.test(command.pattern);
    const finalPattern = isRegex
      ? command.pattern
      : VietnameseRegexBuilder.buildRegex(command.pattern);

    const exists = await this.toxicWordRepository.existsByPattern(finalPattern);
    if (exists) {
      throw new BadRequestDomainException(
        'Từ khóa hoặc pattern này đã tồn tại.',
      );
    }

    const toxicWord = ToxicWord.create({
      id: this.idGenerator.generate(),
      pattern: finalPattern,
      group: command.group,
      originalWord: command.pattern,
    });

    const savedWord = await this.toxicWordRepository.create(toxicWord);

    // Notify listeners to update cache
    this.eventEmitter.emit('toxic-words.updated');

    return savedWord;
  }
}
