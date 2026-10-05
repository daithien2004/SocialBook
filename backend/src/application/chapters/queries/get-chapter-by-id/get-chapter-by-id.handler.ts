import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  NotFoundDomainException,
  BadRequestDomainException,
} from '@/shared/domain/common-exceptions';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { ErrorMessages } from '@/common/constants/error-messages';
import { GetChapterByIdQuery } from './get-chapter-by-id.query';
import { ChapterResult } from '../get-chapters/get-chapters.result';
import { ChapterApplicationMapper } from '../../mappers/chapter.mapper';

@QueryHandler(GetChapterByIdQuery)
export class GetChapterByIdHandler implements IQueryHandler<
  GetChapterByIdQuery,
  ChapterResult
> {
  constructor(private readonly chapterRepository: IChapterRepository) {}

  async execute(query: GetChapterByIdQuery): Promise<ChapterResult> {
    if (!query.id) {
      throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
    }

    const chapterId = ChapterId.create(query.id);
    const chapter = await this.chapterRepository.findById(chapterId);

    if (!chapter) {
      throw new NotFoundDomainException(ErrorMessages.CHAPTER_NOT_FOUND);
    }

    await this.chapterRepository.incrementViews(chapterId);

    return ChapterApplicationMapper.toResult(chapter);
  }
}
