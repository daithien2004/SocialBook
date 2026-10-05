import { Genre } from '@/domain/genres/entities/genre.entity';
import { Query } from '@nestjs/cqrs';
export class GetGenreByIdQuery extends Query<Genre> {
  constructor(public readonly id: string) {
    super();}
}
