import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { ReadingStatus } from '@/modules/library/domain/library/entities/reading-list.entity';
import type { LibraryItemReadModel } from '@/modules/library/application/read-models/library-item.read-model';

export abstract class LibraryReadRepository {
  abstract countByCollectionId(collectionId: string): Promise<number>;

  abstract findByCollectionId(
    collectionId: string,
  ): Promise<LibraryItemReadModel[]>;

  abstract findDetailByUserIdAndBookId(
    userId: string,
    bookId: string,
  ): Promise<LibraryItemReadModel | null>;

  abstract findAllDetailByUserId(
    userId: string,
    status?: ReadingStatus | ReadingStatus[],
  ): Promise<LibraryItemReadModel[]>;

  abstract findPageByUser(
    userId: string,
    status: ReadingStatus | ReadingStatus[] | undefined,
    page: PageParams,
  ): Promise<PageResult<LibraryItemReadModel>>;
}
