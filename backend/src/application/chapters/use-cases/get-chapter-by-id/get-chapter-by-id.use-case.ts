import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { ErrorMessages } from '@/common/constants/error-messages';
import { GetChapterByIdQuery } from './get-chapter-by-id.query';
import { ChapterResult } from '../get-chapters/get-chapters.result';
import { ChapterApplicationMapper } from '../../mappers/chapter.mapper';

@Injectable()
export class GetChapterByIdUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository
    ) { }

    async execute(query: GetChapterByIdQuery): Promise<ChapterResult> {
        if (!query.id) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const chapterId = ChapterId.create(query.id);
        const chapter = await this.chapterRepository.findById(chapterId);

        if (!chapter) {
            throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);
        }

        await this.chapterRepository.incrementViews(chapterId);

        return ChapterApplicationMapper.toResult(chapter);
    }
}
