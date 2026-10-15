import { DeleteUserHighlightCommand } from './delete-user-highlight.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IUserHighlightRepository } from '@/modules/user-highlights/domain/repositories/user-highlight.repository.interface';
import { subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(DeleteUserHighlightCommand)
export class DeleteUserHighlightHandler implements ICommandHandler<DeleteUserHighlightCommand> {
  constructor(private readonly highlightRepository: IUserHighlightRepository) {}

  @Transactional()
  async execute(command: DeleteUserHighlightCommand): Promise<void> {
    const highlight = await this.highlightRepository.findById(
      command.highlightId,
    );

    if (!highlight) {
      throw new NotFoundDomainException('Highlight not found');
    }

    if (
      !command.actor.ability.can(
        'delete',
        subject('UserHighlight', {
          id: highlight.id,
          userId: highlight.userId,
        }),
      )
    ) {
      throw new ForbiddenDomainException('USER_HIGHLIGHT_DELETE_FORBIDDEN');
    }

    await this.highlightRepository.delete(command.highlightId);
  }
}
