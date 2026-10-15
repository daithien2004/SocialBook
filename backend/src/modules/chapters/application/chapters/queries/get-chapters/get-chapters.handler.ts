import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@/shared/domain/pagination.types';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { GetChaptersQuery } from './get-chapters.query';
import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';

@QueryHandler(GetChaptersQuery)
export class GetChaptersHandler implements IQueryHandler<
  GetChaptersQuery,
  PaginatedResult<ChapterReadModel>
> {
  constructor(private readonly chapterReadRepository: IChapterReadRepository) {}

  async execute(
    query: GetChaptersQuery,
  ): Promise<PaginatedResult<ChapterReadModel>> {
    const { actor, filter, pagination, sort } = query.props;
    return this.chapterReadRepository.findPaginated(
      actor.ability,
      filter,
      pagination,
      sort,
    );
  }
}
