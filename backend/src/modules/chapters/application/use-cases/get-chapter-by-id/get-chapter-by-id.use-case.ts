import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IChapterRepository } from '../../../domain/repositories/chapter.repository.interface';
import { Chapter } from '../../../domain/entities/chapter.entity';
import { ChapterId } from '../../../domain/value-objects/chapter-id.vo';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class GetChapterByIdUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository
    ) {}

    async execute(id: string): Promise<Chapter> {
        if (!id) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const chapterId = ChapterId.create(id);
        const chapter = await this.chapterRepository.findById(chapterId);

        if (!chapter) {
            throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);
        }

        // Increment views
        await this.chapterRepository.incrementViews(chapterId);

        return chapter;
    }
}
