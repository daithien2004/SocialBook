import { Injectable, Inject } from '@nestjs/common';
import type { IUserHighlightRepository } from '@/domain/user-highlights/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/domain/user-highlights/entities/user-highlight.entity';

export interface CreateUserHighlightCommand {
  userId: string;
  bookId: string;
  chapterId: string;
  paragraphId: string;
  content: string;
  color?: string;
  note?: string;
}

@Injectable()
export class CreateUserHighlightUseCase {
  constructor(
    @Inject('IUserHighlightRepository')
    private readonly highlightRepository: IUserHighlightRepository,
  ) {}

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
