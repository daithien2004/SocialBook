import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IChapterRepository } from '../../../domain/repositories/chapter.repository.interface';
import { ChapterId } from '../../../domain/value-objects/chapter-id.vo';
import { DeleteChapterCommand } from './delete-chapter.command';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class DeleteChapterUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository
    ) {}

    async execute(command: DeleteChapterCommand): Promise<void> {
        if (!command.id) {
            throw new BadRequestException(ErrorMessages.INVALID_ID);
        }

        const chapterId = ChapterId.create(command.id);
        const chapter = await this.chapterRepository.findById(chapterId);

        if (!chapter) {
            throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);
        }

        await this.chapterRepository.delete(chapterId);
    }
}
