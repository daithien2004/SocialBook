import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PaginationOptions } from '@/shared/domain/pagination.types';
import type { ChapterListReadModel } from '@/modules/chapters/application/read-models/chapter-list.read-model';

export class GetBookChaptersQuery extends Query<ChapterListReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly bookSlug: string,
    public readonly pagination: PaginationOptions,
  ) {
    super();
  }
}
