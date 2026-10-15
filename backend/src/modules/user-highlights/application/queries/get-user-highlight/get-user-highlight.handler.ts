import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { UserHighlightReadRepository } from '../../ports/user-highlight-read.repository';
import { GetUserHighlightQuery } from './get-user-highlight.query';

@QueryHandler(GetUserHighlightQuery)
export class GetUserHighlightHandler implements IQueryHandler<GetUserHighlightQuery> {
  constructor(
    private readonly highlightReadRepository: UserHighlightReadRepository,
  ) {}

  execute(query: GetUserHighlightQuery) {
    return this.highlightReadRepository.findAccessibleById(
      query.actor.ability,
      query.id,
    );
  }
}
