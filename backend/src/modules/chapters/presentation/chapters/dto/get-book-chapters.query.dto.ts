import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import type { Actor } from '@/shared/casl/actor';
import { GetBookChaptersQuery } from '@/modules/chapters/application/chapters/queries/get-book-chapters/get-book-chapters.query';

export class GetBookChaptersQueryDto extends PaginationQueryDto {
  toQuery(actor: Actor, bookSlug: string): GetBookChaptersQuery {
    return new GetBookChaptersQuery(actor, bookSlug, {
      page: this.actualPage,
      limit: this.actualLimit,
    });
  }
}
