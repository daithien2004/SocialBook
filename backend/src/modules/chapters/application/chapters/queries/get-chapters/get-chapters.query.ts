import { Query } from '@nestjs/cqrs';
import { PaginatedResult } from '@/shared/domain/pagination.types';
import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';
import type { Actor } from '@/shared/casl/actor';
import type {
  ChapterFilter,
  ChapterSortField,
} from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import type {
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';

interface GetChaptersQueryProps {
  actor: Actor;
  filter: ChapterFilter;
  pagination: PaginationOptions;
  sort: SortOptions<ChapterSortField>;
}

export class GetChaptersQuery extends Query<PaginatedResult<ChapterReadModel>> {
  constructor(public readonly props: GetChaptersQueryProps) {
    super();
  }
}
