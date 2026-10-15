import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddToxicWordCommand } from './add-toxic-word.command';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IToxicWordRepository } from '@/modules/content-moderation/domain/repositories/toxic-word.repository.interface';
import { ToxicWord } from '@/modules/content-moderation/domain/entities/toxic-word.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { VietnameseRegexBuilder } from '@/modules/content-moderation/domain/utils/vietnamese-regex-builder';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { ForbiddenError } from '@casl/ability';
import type { ToxicWordResult } from '@/modules/content-moderation/application/toxic-word.result';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(AddToxicWordCommand)
export class AddToxicWordHandler implements ICommandHandler<AddToxicWordCommand> {
  constructor(
    private readonly toxicWordRepository: IToxicWordRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: AddToxicWordCommand): Promise<ToxicWordResult> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'ToxicWord',
    );
    const result = await this.createToxicWord(command);

    // Notify listeners only after the database transaction commits.
    this.eventEmitter.emit(EventNames.TOXIC_WORDS_UPDATED);
    return result;
  }

  @Transactional()
  private async createToxicWord(
    command: AddToxicWordCommand,
  ): Promise<ToxicWordResult> {
    const isRegex = /[[\]\\^$|?*+]/.test(command.pattern);
    const finalPattern = isRegex
      ? command.pattern
      : VietnameseRegexBuilder.buildRegex(command.pattern);

    const exists = await this.toxicWordRepository.existsByPattern(finalPattern);
    if (exists) {
      throw new BadRequestDomainException(
        'Từ khóa hoặc pattern nÃ y đã tồn tại.',
      );
    }

    const toxicWord = ToxicWord.create({
      id: this.idGenerator.generate(),
      pattern: finalPattern,
      group: command.group,
      originalWord: command.originalWord ?? command.pattern,
    });

    const savedWord = await this.toxicWordRepository.create(toxicWord);

    return {
      id: savedWord.id,
      pattern: savedWord.pattern,
      group: savedWord.group,
      originalWord: savedWord.originalWord,
      createdAt: savedWord.createdAt,
      updatedAt: savedWord.updatedAt,
    };
  }
}
