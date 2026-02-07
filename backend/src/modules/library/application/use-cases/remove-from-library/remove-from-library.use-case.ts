import { IReadingListRepository } from '../../../domain/repositories/reading-list.repository.interface';
import { IReadingProgressRepository } from '../../../domain/repositories/reading-progress.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { BookId } from '../../../domain/value-objects/book-id.vo';
import { ChapterId } from '../../../domain/value-objects/chapter-id.vo';

export interface RemoveFromLibraryRequest {
    userId: string;
    bookId: string;
}

export interface RemoveFromLibraryResponse {
    success: boolean;
}

export class RemoveFromLibraryUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository,
        private readonly readingProgressRepository: IReadingProgressRepository
    ) {}

    async execute(request: RemoveFromLibraryRequest): Promise<RemoveFromLibraryResponse> {
        const userId = UserId.create(request.userId);
        const bookId = BookId.create(request.bookId);

        // Check if reading list entry exists
        const exists = await this.readingListRepository.exists(userId, bookId);
        
        if (!exists) {
            return { success: true }; // Already removed or never existed
        }

        // Get all reading progress for this book to remove them as well
        const readingProgresses = await this.readingProgressRepository.findByUserIdAndBookId(userId, bookId);

        // Remove all reading progress entries for this book
        await Promise.all(
            readingProgresses.map(progress => 
                this.readingProgressRepository.remove(userId, ChapterId.create(progress.chapterId.toString()))
            )
        );

        // Remove the reading list entry
        await this.readingListRepository.remove(userId, bookId);

        return { success: true };
    }
}
