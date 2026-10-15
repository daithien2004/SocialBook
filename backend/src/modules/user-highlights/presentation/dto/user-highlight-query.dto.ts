import type { Actor } from '@/shared/casl/actor';
import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { GetUserHighlightsQuery } from '../../application/queries/get-user-highlights/get-user-highlights.query';

export class UserHighlightQueryDto extends PaginationQueryDto {
  toBookQuery(actor: Actor, bookId: string): GetUserHighlightsQuery {
    return new GetUserHighlightsQuery(
      actor,
      bookId,
      undefined,
      this.actualPage,
      this.actualLimit,
    );
  }

  toChapterQuery(actor: Actor, chapterId: string): GetUserHighlightsQuery {
    return new GetUserHighlightsQuery(
      actor,
      undefined,
      chapterId,
      this.actualPage,
      this.actualLimit,
    );
  }
}
