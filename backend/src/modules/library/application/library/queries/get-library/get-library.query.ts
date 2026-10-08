import { Query } from '@nestjs/cqrs';
import { ReadingStatus } from '@/modules/library/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/modules/library/domain/library/read-models/library-item.read-model';

export class GetLibraryQuery extends Query<LibraryItemReadModel[]> {
  constructor(
    public readonly userId: string,
    public readonly status?: ReadingStatus | ReadingStatus[],
    public readonly limit?: number,
  ) {
    super();
  }
}
