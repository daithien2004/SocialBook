import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { CreateBookmarkCommand } from '@/modules/bookmarks/application/commands/create-bookmark/create-bookmark.command';

export class CreateBookmarkRequestDto {
  @IsUUID('4')
  bookId!: string;

  @IsUUID('4')
  chapterId!: string;

  @IsString()
  @IsNotEmpty()
  chapterSlug!: string;

  @IsUUID('4')
  paragraphId!: string;

  @IsString()
  @MaxLength(500)
  textPreview!: string;

  toCommand(actor: Actor): CreateBookmarkCommand {
    return new CreateBookmarkCommand(actor, {
      bookId: this.bookId,
      chapterId: this.chapterId,
      chapterSlug: this.chapterSlug,
      paragraphId: this.paragraphId,
      textPreview: this.textPreview,
    });
  }
}
