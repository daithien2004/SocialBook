import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import type { ChapterDetailReadModel } from '@/modules/chapters/application/read-models/chapter-detail.read-model';
import { GetReadingRoomChapterQuery } from './get-reading-room-chapter.query';

@QueryHandler(GetReadingRoomChapterQuery)
export class GetReadingRoomChapterHandler implements IQueryHandler<
  GetReadingRoomChapterQuery,
  ChapterDetailReadModel | null
> {
  constructor(private readonly chapterReadRepository: IChapterReadRepository) {}

  execute(
    query: GetReadingRoomChapterQuery,
  ): Promise<ChapterDetailReadModel | null> {
    return this.chapterReadRepository.findCurrentRoomChapterById(
      query.bookId,
      query.chapterId,
    );
  }
}
