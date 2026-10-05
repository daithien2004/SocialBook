import { Genre } from '@/domain/genres/entities/genre.entity';
import { Command } from '@nestjs/cqrs';
export class UpdateGenreCommand extends Command<Genre> {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
  ) {
    super();
  }
}
