import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { GenreReadModel } from '../../read-models/genre.read-model';

export class GetGenreByIdQuery extends Query<GenreReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
  ) {
    super();
  }
}
