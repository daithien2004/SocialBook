import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { ReadingListMapper, ReadingListFullDto } from '../../mappers/reading-list.mapper';

export interface GetLibraryRequest {
    userId: string;
    status?: ReadingStatus;
}

// Re-export DTO type for external use
export type GetLibraryResponse = ReadingListFullDto;

export class GetLibraryUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) { }

    async execute(request: GetLibraryRequest): Promise<GetLibraryResponse[]> {
        const userId = UserId.create(request.userId);
        const status = request.status || ReadingStatus.READING;

        const readingLists = await this.readingListRepository.findByUserId(userId, status);

        return ReadingListMapper.toFullDtoList(readingLists);
    }
}


