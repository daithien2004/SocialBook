import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  NotFoundDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IChapterReadRepository } from '@/modules/chapters/application/ports/chapter-read.repository';
import { ChapterErrorMessages } from '@/modules/chapters/application/error-messages';
import { ErrorMessages } from '@/shared/platform/constants/error-messages';
import { GetChapterByIdQuery } from './get-chapter-by-id.query';
import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';

@QueryHandler(GetChapterByIdQuery)
export class GetChapterByIdHandler implements IQueryHandler<
  GetChapterByIdQuery,
  ChapterReadModel
> {
  constructor(private readonly chapterReadRepository: IChapterReadRepository) {}

  async execute(query: GetChapterByIdQuery): Promise<ChapterReadModel> {
    if (!query.id) {
      throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    }

    const chapter = await this.chapterReadRepository.findById(
      query.actor.ability,
      query.id,
    );

    if (!chapter) {
      throw new NotFoundDomainException(ChapterErrorMessages.CHAPTER_NOT_FOUND);
    }

    return chapter;
  }
}
