import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { IUserHighlightRepository } from '@/domain/user-highlights/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/domain/user-highlights/entities/user-highlight.entity';

export interface UpdateUserHighlightCommand {
  highlightId: string;
  userId: string;
  color?: string;
  note?: string;
}

@Injectable()
export class UpdateUserHighlightUseCase {
  constructor(
    @Inject('IUserHighlightRepository')
    private readonly highlightRepository: IUserHighlightRepository,
  ) {}

  async execute(command: UpdateUserHighlightCommand): Promise<UserHighlight> {
    const highlight = await this.highlightRepository.findById(
      command.highlightId,
    );

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    if (highlight.userId !== command.userId) {
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
