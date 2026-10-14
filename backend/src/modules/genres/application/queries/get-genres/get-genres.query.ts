import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { GenreReadModel } from '../../read-models/genre.read-model';

export class GetGenresQuery extends Query<PageResult<GenreReadModel>> {
  constructor(
    public readonly actor: Actor,
    public readonly filter: { name?: string },
    public readonly pagination: PageParams,
  ) {
    super();
  }
}
