import { UpdateUserHighlightCommand } from './update-user-highlight.command';
import { CommandHandler } from '@nestjs/cqrs';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IUserHighlightRepository } from '@/modules/user-highlights/domain/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/modules/user-highlights/domain/entities/user-highlight.entity';
import { Action, Subject } from '@socialbook/shared';
import { subject } from '@casl/ability';

@CommandHandler(UpdateUserHighlightCommand)
export class UpdateUserHighlightHandler {
  constructor(private readonly highlightRepository: IUserHighlightRepository) {}

  async execute(command: UpdateUserHighlightCommand): Promise<UserHighlight> {
    const highlight = await this.highlightRepository.findById(
      command.highlightId,
    );

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    if (
      !command.ability.can(
        Action.Update,
        subject(Subject.UserHighlight, highlight),
      )
    ) {
      throw new UnauthorizedException(
        'You can only update your own highlights',
      );
    }

    if (command.color !== undefined) {
      highlight.updateColor(command.color);
    }

    if (command.note !== undefined) {
      highlight.updateNote(command.note);
    }

    await this.highlightRepository.save(highlight);
    return highlight;
  }
}
