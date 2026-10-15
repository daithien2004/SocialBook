import { Command } from '@nestjs/cqrs';
import { ReadingStatus } from '@/modules/library/domain/library/entities/reading-list.entity';
import type { LibraryItemReadModel } from '@/modules/library/application/read-models/library-item.read-model';
import type { Actor } from '@/shared/casl/actor';

export class UpdateStatusCommand extends Command<LibraryItemReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly bookId: string,
    public readonly status: ReadingStatus,
  ) {
    super();
  }
}
