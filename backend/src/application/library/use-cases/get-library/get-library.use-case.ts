import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { ReadingListResponseDto } from '@/presentation/library/dto/library.response.dto';

export interface GetLibraryRequest {
    userId: string;
    status?: ReadingStatus;
}

export class GetLibraryUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) { }

    async execute(request: GetLibraryRequest): Promise<ReadingListResponseDto[]> {
        const userId = UserId.create(request.userId);
        const status = request.status || ReadingStatus.READING;

        const readingLists = await this.readingListRepository.findByUserId(userId, status);

        return ReadingListResponseDto.fromArray(readingLists);
    }
}


