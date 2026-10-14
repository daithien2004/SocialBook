import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { GenreReadModel } from '../../read-models/genre.read-model';

export class FindGenreByNameQuery extends Query<GenreReadModel | null> {
  constructor(
    public readonly actor: Actor,
    public readonly name: string,
  ) {
    super();
  }
}
