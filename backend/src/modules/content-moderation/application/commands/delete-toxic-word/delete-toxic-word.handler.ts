import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteToxicWordCommand } from './delete-toxic-word.command';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IToxicWordRepository } from '@/modules/content-moderation/domain/repositories/toxic-word.repository.interface';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { EventNames } from '@/shared/platform/constants/event-names.constant';
import { ForbiddenError } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(DeleteToxicWordCommand)
export class DeleteToxicWordHandler implements ICommandHandler<DeleteToxicWordCommand> {
  constructor(
    private readonly toxicWordRepository: IToxicWordRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: DeleteToxicWordCommand): Promise<void> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'delete',
      'ToxicWord',
    );
    await this.deleteToxicWord(command.id);

    // Notify listeners only after the database transaction commits.
    this.eventEmitter.emit(EventNames.TOXIC_WORDS_UPDATED);
  }

  @Transactional()
  private async deleteToxicWord(id: string): Promise<void> {
    const deleted = await this.toxicWordRepository.delete(id);

    if (!deleted) {
      throw new NotFoundDomainException(
        'Không tìm thấy từ khóa toxic cần xóa.',
      );
    }
  }
}
