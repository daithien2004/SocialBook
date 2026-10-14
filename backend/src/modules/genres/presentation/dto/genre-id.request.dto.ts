import { IsUUID } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { DeleteGenreCommand } from '../../application/commands/delete-genre/delete-genre.command';
import { GetGenreByIdQuery } from '../../application/queries/get-genre-by-id/get-genre-by-id.query';

export class GenreIdRequestDto {
  @IsUUID('4')
  id!: string;

  toQuery(actor: Actor): GetGenreByIdQuery {
    return new GetGenreByIdQuery(actor, this.id);
  }

  toDeleteCommand(actor: Actor): DeleteGenreCommand {
    return new DeleteGenreCommand(actor, this.id);
  }
}
