import { UpdateUserHighlightCommand } from './update-user-highlight.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IUserHighlightRepository } from '@/modules/user-highlights/domain/repositories/user-highlight.repository.interface';
import { subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(UpdateUserHighlightCommand)
export class UpdateUserHighlightHandler implements ICommandHandler<UpdateUserHighlightCommand> {
  constructor(private readonly highlightRepository: IUserHighlightRepository) {}

  @Transactional()
  async execute(command: UpdateUserHighlightCommand): Promise<void> {
    const highlight = await this.highlightRepository.findById(
      command.highlightId,
    );

    if (!highlight) {
      throw new NotFoundDomainException('Highlight not found');
    }

    if (
      !command.actor.ability.can(
        'update',
        subject('UserHighlight', {
          id: highlight.id,
          userId: highlight.userId,
        }),
      )
    ) {
      throw new ForbiddenDomainException('USER_HIGHLIGHT_UPDATE_FORBIDDEN');
    }

    if (command.color !== undefined) {
      highlight.updateColor(command.color);
    }

    if (command.note !== undefined) {
      highlight.updateNote(command.note);
    }

    await this.highlightRepository.save(highlight);
  }
}
