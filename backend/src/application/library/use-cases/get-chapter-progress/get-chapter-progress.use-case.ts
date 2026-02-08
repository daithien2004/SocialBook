import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { ChapterId } from '@/domain/library/value-objects/chapter-id.vo';

export interface GetChapterProgressRequest {
    userId: string;
    bookId: string;
    chapterId: string;
}

export interface GetChapterProgressResponse {
    progress: number;
}

export class GetChapterProgressUseCase {
    constructor(
        private readonly readingProgressRepository: IReadingProgressRepository
    ) {}

    async execute(request: GetChapterProgressRequest): Promise<GetChapterProgressResponse> {
        if (!request.bookId || !request.chapterId) {
            return { progress: 0 };
        }

        const userId = UserId.create(request.userId);
        const chapterId = ChapterId.create(request.chapterId);

        const readingProgress = await this.readingProgressRepository.findByUserIdAndChapterId(userId, chapterId);

        return {
            progress: readingProgress?.progress || 0
        };
    }
}


