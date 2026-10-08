import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReadingList } from '@/modules/library/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/modules/library/domain/library/read-models/library-item.read-model';
import { IReadingListRepository } from '@/modules/library/domain/library/repositories/reading-list.repository.interface';
import { BookId } from '@/modules/library/domain/library/value-objects/book-id.vo';
import { UserId } from '@/modules/library/domain/library/value-objects/user-id.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { InternalServerErrorException } from '@nestjs/common';
import { UpdateCollectionsCommand } from './update-collections.command';

@CommandHandler(UpdateCollectionsCommand)
export class UpdateCollectionsHandler implements ICommandHandler<
  UpdateCollectionsCommand,
  LibraryItemReadModel
> {
  constructor(
    private readonly readingListRepository: IReadingListRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    command: UpdateCollectionsCommand,
  ): Promise<LibraryItemReadModel> {
    const userId = UserId.create(command.userId);
    const bookId = BookId.create(command.bookId);

    let readingList = await this.readingListRepository.findByUserIdAndBookId(
      userId,
      bookId,
    );

    if (!readingList) {
      readingList = ReadingList.create({
        id: this.idGenerator.generate(),
        userId: command.userId,
        bookId: command.bookId,
      });
    }

    readingList.updateCollections(command.collectionIds);
    await this.readingListRepository.save(readingList);

    const result = await this.readingListRepository.findDetailByUserIdAndBookId(
      userId,
      bookId,
    );
    if (!result) {
      throw new InternalServerErrorException(
        'Failed to retrieve updated reading list detail',
      );
    }
    return result;
  }
}
