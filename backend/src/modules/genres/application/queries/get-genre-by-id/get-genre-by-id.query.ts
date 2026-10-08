import { Genre } from '@/modules/genres/domain/entities/genre.entity';
import { Query } from '@nestjs/cqrs';
export class GetGenreByIdQuery extends Query<Genre> {
  constructor(public readonly id: string) {
    super();
  }
}
