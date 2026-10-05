import { Command } from '@nestjs/cqrs';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';

export class UpdateCollectionsCommand extends Command<LibraryItemReadModel> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly collectionIds: string[],
  ) {
    super();
  }
}
