import { IsUUID } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { GetAuthorQuery } from '../../application/queries/get-author/get-author.query';
import { DeleteAuthorCommand } from '../../application/commands/delete-author/delete-author.command';

export class AuthorIdRequestDto {
  @IsUUID('4')
  id!: string;

  toQuery(actor: Actor): GetAuthorQuery {
    return new GetAuthorQuery(actor, this.id);
  }

  toDeleteCommand(actor: Actor): DeleteAuthorCommand {
    return new DeleteAuthorCommand(actor, this.id);
  }
}
