import { IsUUID } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { DeleteBookmarkCommand } from '@/modules/bookmarks/application/commands/delete-bookmark/delete-bookmark.command';

export class DeleteBookmarkRequestDto {
  @IsUUID('4')
  paragraphId!: string;

  toCommand(actor: Actor): DeleteBookmarkCommand {
    return new DeleteBookmarkCommand(actor, this.paragraphId);
  }
}
