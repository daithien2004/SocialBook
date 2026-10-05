import { CommandHandler } from '@nestjs/cqrs';
import { DeleteToxicWordCommand } from './delete-toxic-word.command';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IToxicWordRepository } from '@/domain/content-moderation/repositories/toxic-word.repository.interface';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { EventNames } from '@/common/constants/event-names.constant';

@CommandHandler(DeleteToxicWordCommand)
export class DeleteToxicWordHandler {
  constructor(
    private readonly toxicWordRepository: IToxicWordRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: DeleteToxicWordCommand): Promise<void> {
    const deleted = await this.toxicWordRepository.delete((command as any).id);

    if (!deleted) {
      throw new NotFoundDomainException(
        'Không tìm thấy từ khóa toxic cần xóa.',
      );
    }

    // Notify listeners to update cache
    this.eventEmitter.emit(EventNames.TOXIC_WORDS_UPDATED);
  }
}
