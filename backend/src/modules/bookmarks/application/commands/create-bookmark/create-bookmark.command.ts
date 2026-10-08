import { Command } from '@nestjs/cqrs';
import { Bookmark } from '../../../domain/entities/bookmark.entity';

export class CreateBookmarkCommand extends Command<Bookmark> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly chapterSlug: string,
    public readonly paragraphId: string,
    public readonly textPreview: string,
  ) {
    super();
  }
}
