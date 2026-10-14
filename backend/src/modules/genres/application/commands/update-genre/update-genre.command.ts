import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { GenreReadModel } from '../../read-models/genre.read-model';

export class UpdateGenreCommand extends Command<GenreReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
  ) {
    super();
  }
}
