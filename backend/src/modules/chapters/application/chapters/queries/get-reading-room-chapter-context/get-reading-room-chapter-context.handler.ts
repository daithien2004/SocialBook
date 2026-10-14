import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { getChapterContext } from '@/modules/chapters/application/chapters/chapter-context-extractor';
import type { ReadingRoomChapterContextReadModel } from '@/modules/chapters/application/read-models/reading-room-chapter-context.read-model';
import { GetReadingRoomChapterContextQuery } from './get-reading-room-chapter-context.query';

@QueryHandler(GetReadingRoomChapterContextQuery)
export class GetReadingRoomChapterContextHandler implements IQueryHandler<
  GetReadingRoomChapterContextQuery,
  ReadingRoomChapterContextReadModel | null
> {
  constructor(private readonly chapterReadRepository: IChapterReadRepository) {}

  async execute(
    query: GetReadingRoomChapterContextQuery,
  ): Promise<ReadingRoomChapterContextReadModel | null> {
    const chapter = await this.chapterReadRepository.findDetailByBookIdAndSlug(
      query.bookId,
      query.chapterSlug,
    );
    if (!chapter) return null;

    return {
      bookTitle: chapter.book.title,
      chapterTitle: chapter.chapter.title,
      context: getChapterContext(
        chapter.chapter.paragraphs,
        query.selectedText,
      ),
    };
  }
}
