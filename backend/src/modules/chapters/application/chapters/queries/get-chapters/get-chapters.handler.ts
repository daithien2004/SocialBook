import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { ChapterListReadModel } from '@/modules/chapters/domain/chapters/read-models/chapter-list.read-model';
import { ChapterFilter } from '@/modules/chapters/domain/chapters/repositories/chapter.repository.interface';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { GetChaptersQuery } from './get-chapters.query';
import { ChapterResult } from './get-chapters.result';

@QueryHandler(GetChaptersQuery)
export class GetChaptersHandler implements IQueryHandler<
  GetChaptersQuery,
  ChapterListReadModel | PaginatedResult<ChapterResult>
> {
  constructor(private readonly chapterReadRepository: IChapterReadRepository) {}

  async execute(
    query: GetChaptersQuery,
  ): Promise<PaginatedResult<ChapterResult> | ChapterListReadModel> {
    const filter: ChapterFilter = {
      title: query.title,
      bookId: query.bookId,
      orderIndex: query.orderIndex,
    };

    const pagination: PaginationOptions = {
      page: query.page,
      limit: query.limit,
    };

    const sort: SortOptions = {
      sortBy: query.sortBy,
      order: query.order,
    };

    if (query.bookSlug) {
      return await this.chapterReadRepository.findListByBookSlug(
        query.bookSlug,
        pagination,
      );
    }

    return this.chapterReadRepository.findPaginated(filter, pagination, sort);
  }
}
