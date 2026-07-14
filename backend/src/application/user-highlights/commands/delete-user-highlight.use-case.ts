import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { IUserHighlightRepository } from '@/domain/user-highlights/repositories/user-highlight.repository.interface';

export interface DeleteUserHighlightCommand {
  highlightId: string;
  userId: string;
}

@Injectable()
export class DeleteUserHighlightUseCase {
  constructor(
    @Inject('IUserHighlightRepository')
    private readonly highlightRepository: IUserHighlightRepository,
  ) {}

  async execute(command: DeleteUserHighlightCommand): Promise<void> {
    const highlight = await this.highlightRepository.findById(
      command.highlightId,
    );

    if (!highlight) {
      throw new NotFoundException('Highlight not found');
    }

    if (highlight.userId !== command.userId) {
      throw new UnauthorizedException(
        'You can only delete your own highlights',
      );
    }

    await this.highlightRepository.delete(command.highlightId);
  }
}
