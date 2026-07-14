import { Injectable, Inject } from '@nestjs/common';
import type { IUserHighlightRepository } from '@/domain/user-highlights/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/domain/user-highlights/entities/user-highlight.entity';

export interface GetUserHighlightsQuery {
  userId: string;
  bookId?: string;
  chapterId?: string;
}

@Injectable()
export class GetUserHighlightsUseCase {
  constructor(
    @Inject('IUserHighlightRepository')
    private readonly highlightRepository: IUserHighlightRepository,
  ) {}

  async execute(query: GetUserHighlightsQuery): Promise<UserHighlight[]> {
    if (query.chapterId) {
      return this.highlightRepository.findByChapterId(
        query.userId,
        query.chapterId,
      );
    }
    if (query.bookId) {
      return this.highlightRepository.findByBookId(query.userId, query.bookId);
    }
    return [];
  }
}
