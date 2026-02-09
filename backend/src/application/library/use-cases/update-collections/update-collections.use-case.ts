import { Injectable } from '@nestjs/common';
import { IReadingListRepository } from '@/domain/library/repositories/reading-list.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ReadingList } from '@/domain/library/entities/reading-list.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { UpdateCollectionsCommand } from './update-collections.command';

@Injectable()
export class UpdateCollectionsUseCase {
    constructor(
        private readonly readingListRepository: IReadingListRepository,
        private readonly idGenerator: IIdGenerator,
    ) { }

    async execute(command: UpdateCollectionsCommand): Promise<ReadingList> {
        const userId = UserId.create(command.userId);
        const bookId = BookId.create(command.bookId);

        let readingList = await this.readingListRepository.findByUserIdAndBookId(userId, bookId);

        if (!readingList) {
            readingList = ReadingList.create({
                id: this.idGenerator.generate(),
                userId: command.userId,
                bookId: command.bookId
            });
        }

        readingList.updateCollections(command.collectionIds);
        await this.readingListRepository.save(readingList);

        return readingList;
    }
}
