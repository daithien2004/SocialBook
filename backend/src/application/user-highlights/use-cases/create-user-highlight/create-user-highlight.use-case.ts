import { Injectable } from '@nestjs/common';
import { IUserHighlightRepository } from '@/domain/user-highlights/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/domain/user-highlights/entities/user-highlight.entity';
import { CreateUserHighlightCommand } from './create-user-highlight.command';

@Injectable()
export class CreateUserHighlightUseCase {
  constructor(private readonly highlightRepository: IUserHighlightRepository) {}

  async execute(command: CreateUserHighlightCommand): Promise<UserHighlight> {
    const highlight = UserHighlight.create({
      userId: command.userId,
      bookId: command.bookId,
      chapterId: command.chapterId,
      paragraphId: command.paragraphId,
      content: command.content,
      color: command.color || '#ffeb3b',
      note: command.note,
    });

    await this.highlightRepository.save(highlight);
    return highlight;
  }
}
