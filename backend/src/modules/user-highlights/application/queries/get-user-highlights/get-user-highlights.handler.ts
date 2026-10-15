import { GetUserHighlightsQuery } from './get-user-highlights.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { UserHighlightReadRepository } from '../../ports/user-highlight-read.repository';

@QueryHandler(GetUserHighlightsQuery)
export class GetUserHighlightsHandler implements IQueryHandler<GetUserHighlightsQuery> {
  constructor(
    private readonly highlightReadRepository: UserHighlightReadRepository,
  ) {}

  execute(query: GetUserHighlightsQuery) {
    return this.highlightReadRepository.findPageForUser(
      query.actor.ability,
      query.actor.userId,
      {
        ...(query.bookId ? { bookId: query.bookId } : {}),
        ...(query.chapterId ? { chapterId: query.chapterId } : {}),
      },
      query.limit,
      (query.page - 1) * query.limit,
    );
  }
}
