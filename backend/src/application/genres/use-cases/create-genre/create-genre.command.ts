import { Genre } from '@/domain/genres/entities/genre.entity';
import { Command } from '@nestjs/cqrs';
export class CreateGenreCommand extends Command<Genre> {
  constructor(
    public readonly name: string,
    public readonly description?: string,
  ) {
    super();}
}
