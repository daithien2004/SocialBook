import { Injectable } from '@nestjs/common';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';
import { RemoveFromLibraryCommand } from './remove-from-library.command';

@Injectable()
export class RemoveFromLibraryUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository,
        private readonly readingProgressRepository: IReadingProgressRepository
    ) { }

    async execute(command: RemoveFromLibraryCommand): Promise<void> {
        const userId = UserId.create(command.userId);
        const bookId = BookId.create(command.bookId);

        const exists = await this.readingListRepository.exists(userId, bookId);

        if (!exists) {
            return;
        }

        const readingProgresses = await this.readingProgressRepository.findByUserIdAndBookId(userId, bookId);

        await Promise.all(
            readingProgresses.map(progress =>
                this.readingProgressRepository.remove(userId, ChapterId.create(progress.chapterId.toString()))
            )
        );

        await this.readingListRepository.remove(userId, bookId);
    }
}
