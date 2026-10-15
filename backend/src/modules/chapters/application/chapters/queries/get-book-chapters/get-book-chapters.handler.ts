import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { ChapterErrorMessages } from '@/modules/chapters/application/error-messages';
import { GetBookChaptersQuery } from './get-book-chapters.query';
import type { ChapterListReadModel } from '@/modules/chapters/application/read-models/chapter-list.read-model';

@QueryHandler(GetBookChaptersQuery)
export class GetBookChaptersHandler implements IQueryHandler<
  GetBookChaptersQuery,
  ChapterListReadModel
> {
  constructor(private readonly chapterReadRepository: IChapterReadRepository) {}

  async execute(query: GetBookChaptersQuery): Promise<ChapterListReadModel> {
    const result = await this.chapterReadRepository.findListByBookSlug(
      query.actor.ability,
      query.bookSlug,
      query.pagination,
    );
    if (!result) {
      throw new NotFoundDomainException(ChapterErrorMessages.BOOK_NOT_FOUND);
    }
    return result;
  }
}
