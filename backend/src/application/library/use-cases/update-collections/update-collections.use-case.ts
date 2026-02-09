import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ReadingList } from '@/domain/library/entities/reading-list.entity';
import { UpdateCollectionsCommand } from './update-collections.command';

export class UpdateCollectionsUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository
    ) { }

    async execute(command: UpdateCollectionsCommand): Promise<ReadingList> {
        const userId = UserId.create(command.userId);
        const bookId = BookId.create(command.bookId);

        let readingList = await this.readingListRepository.findByUserIdAndBookId(userId, bookId);

        if (!readingList) {
            readingList = ReadingList.create({
                userId: command.userId,
                bookId: command.bookId
            });
        }

        readingList.updateCollections(command.collectionIds);
        await this.readingListRepository.save(readingList);

        return readingList;
    }
}
