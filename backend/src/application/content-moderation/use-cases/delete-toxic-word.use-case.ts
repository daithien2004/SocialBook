import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IToxicWordRepository } from '@/domain/content-moderation/repositories/toxic-word.repository.interface';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

export interface DeleteToxicWordCommand {
  id: string;
}

@Injectable()
export class DeleteToxicWordUseCase {
  constructor(
    private readonly toxicWordRepository: IToxicWordRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: DeleteToxicWordCommand): Promise<void> {
    const deleted = await this.toxicWordRepository.delete(command.id);

    if (!deleted) {
      throw new NotFoundDomainException(
        'Không tìm thấy từ khóa toxic cần xóa.',
      );
    }

    // Notify listeners to update cache
    this.eventEmitter.emit('toxic-words.updated');
  }
}
