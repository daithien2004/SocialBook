import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { GenreReadModel } from '../../read-models/genre.read-model';

export class CreateGenreCommand extends Command<GenreReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly name: string,
    public readonly description?: string,
  ) {
    super();
  }
}
