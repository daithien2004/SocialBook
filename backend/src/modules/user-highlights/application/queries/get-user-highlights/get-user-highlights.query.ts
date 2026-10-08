import { Query } from '@nestjs/cqrs';
import { UserHighlight } from '@/modules/user-highlights/domain/entities/user-highlight.entity';

export class GetUserHighlightsQuery extends Query<UserHighlight[]> {
  constructor(
    public readonly userId: string,
    public readonly bookId?: string,
    public readonly chapterId?: string,
  ) {
    super();
  }
}
