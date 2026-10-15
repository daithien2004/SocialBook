import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { UserHighlightReadModel } from '../../user-highlight.read-model';

export class GetUserHighlightsQuery extends Query<
  PageResult<UserHighlightReadModel>
> {
  constructor(
    public readonly actor: Actor,
    public readonly bookId?: string,
    public readonly chapterId?: string,
    public readonly page = 1,
    public readonly limit = 20,
  ) {
    super();
  }
}
