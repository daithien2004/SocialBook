import { Injectable } from '@nestjs/common';
import { NotFoundDomainException, BadRequestDomainException } from '@/shared/domain/common-exceptions';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { DeleteChapterCommand } from './delete-chapter.command';
import { ErrorMessages } from '@/common/constants/error-messages';

@Injectable()
export class DeleteChapterUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository
    ) {}

    async execute(command: DeleteChapterCommand): Promise<void> {
        if (!command.id) {
            throw new BadRequestDomainException(ErrorMessages.INVALID_ID);
        }

        const chapterId = ChapterId.create(command.id);
        const chapter = await this.chapterRepository.findById(chapterId);

        if (!chapter) {
            throw new NotFoundDomainException(ErrorMessages.CHAPTER_NOT_FOUND);
        }

        await this.chapterRepository.delete(chapterId);
    }
}


