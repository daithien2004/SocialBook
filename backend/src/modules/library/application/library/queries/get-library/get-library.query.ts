import { Query } from '@nestjs/cqrs';
import { ReadingStatus } from '@/modules/library/domain/library/entities/reading-list.entity';
import type { LibraryItemReadModel } from '@/modules/library/application/read-models/library-item.read-model';
import type { Actor } from '@/shared/casl/actor';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';

export class GetLibraryQuery extends Query<PageResult<LibraryItemReadModel>> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly status: ReadingStatus | ReadingStatus[],
    public readonly page: PageParams,
  ) {
    super();
  }
}
