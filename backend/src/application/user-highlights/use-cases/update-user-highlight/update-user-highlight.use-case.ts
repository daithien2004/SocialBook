import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IUserHighlightRepository } from '@/domain/user-highlights/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/domain/user-highlights/entities/user-highlight.entity';
import { UpdateUserHighlightCommand } from './update-user-highlight.command';
import { Action, Subject, AppAbility } from '@socialbook/shared';
import { subject } from '@casl/ability';

@Injectable()
export class UpdateUserHighlightUseCase {
  constructor(private readonly highlightRepository: IUserHighlightRepository) {}

  async execute(command: UpdateUserHighlightCommand): Promise<UserHighlight> {
    const highlight = await this.highlightRepository.findById(
      command.highlightId,
    );

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    if (!command.ability.can(Action.Update, subject(Subject.UserHighlight, highlight))) {
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
