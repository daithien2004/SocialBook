import { GetUserHighlightsQuery } from './get-user-highlights.query';
import { QueryHandler } from '@nestjs/cqrs';
import { IUserHighlightRepository } from '@/modules/user-highlights/domain/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/modules/user-highlights/domain/entities/user-highlight.entity';

@QueryHandler(GetUserHighlightsQuery)
export class GetUserHighlightsHandler {
  constructor(private readonly highlightRepository: IUserHighlightRepository) {}

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
