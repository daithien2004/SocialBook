import { DeleteUserHighlightCommand } from './delete-user-highlight.command';
import { CommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IUserHighlightRepository } from '@/modules/user-highlights/domain/repositories/user-highlight.repository.interface';
import { Action, Subject } from '@socialbook/shared';
import { subject } from '@casl/ability';

@CommandHandler(DeleteUserHighlightCommand)
export class DeleteUserHighlightHandler {
  constructor(private readonly highlightRepository: IUserHighlightRepository) {}

  async execute(command: DeleteUserHighlightCommand): Promise<void> {
    const highlight = await this.highlightRepository.findById(
      command.highlightId,
    );

    if (!highlight) {
      throw new NotFoundDomainException('Highlight not found');
    }

    if (
      !command.ability.can(
        Action.Delete,
        subject(Subject.UserHighlight, highlight),
      )
    ) {
      throw new ForbiddenDomainException(
        'You can only delete your own highlights',
      );
    }

    await this.highlightRepository.delete(command.highlightId);
  }
}
