import { Command } from '@nestjs/cqrs';
import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';

export class UpdateStatusCommand extends Command<LibraryItemReadModel> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly status: ReadingStatus,
  ) {
    super();
  }
}
