import { Query } from '@nestjs/cqrs';
import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/domain/library/read-models/library-item.read-model';

export class GetLibraryQuery extends Query<LibraryItemReadModel[]> {
  constructor(
    public readonly userId: string,
    public readonly status?: ReadingStatus | ReadingStatus[],
    public readonly limit?: number,
  ) {
    super();
  }
}
