import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { LibraryReadRepository } from '@/modules/library/application/ports/library-read.repository';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import type { ReadingStatus } from '@/modules/library/domain/library/entities/reading-list.entity';
import type { LibraryItemReadModel } from '@/modules/library/application/read-models/library-item.read-model';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';
import {
  LIBRARY_ITEM_WITH_RELATIONS,
  toLibraryItemReadModel,
} from './library.mapper';

@Injectable()
export class PrismaLibraryReadRepository extends LibraryReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  countByCollectionId(collectionId: string): Promise<number> {
    return this.transactionHost.tx.readingListCollection.count({
      where: { collectionId },
    });
  }

  async findByCollectionId(
    collectionId: string,
  ): Promise<LibraryItemReadModel[]> {
    const rows = await this.transactionHost.tx.readingList.findMany({
      where: { collections: { some: { collectionId } } },
      include: LIBRARY_ITEM_WITH_RELATIONS,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => toLibraryItemReadModel(row));
  }

  async findDetailByUserIdAndBookId(
    userId: string,
    bookId: string,
  ): Promise<LibraryItemReadModel | null> {
    const row = await this.transactionHost.tx.readingList.findUnique({
      where: { userId_bookId: { userId, bookId } },
      include: LIBRARY_ITEM_WITH_RELATIONS,
    });
    return row ? toLibraryItemReadModel(row) : null;
  }

  async findAllDetailByUserId(
    userId: string,
    status?: ReadingStatus | ReadingStatus[],
  ): Promise<LibraryItemReadModel[]> {
    const statusFilter: Prisma.ReadingListWhereInput['status'] = Array.isArray(
      status,
    )
      ? { in: status }
      : status;
    const rows = await this.transactionHost.tx.readingList.findMany({
      where: {
        userId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: LIBRARY_ITEM_WITH_RELATIONS,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => toLibraryItemReadModel(row));
  }

  async findPageByUser(
    userId: string,
    status: ReadingStatus | ReadingStatus[] | undefined,
    page: PageParams,
  ): Promise<PageResult<LibraryItemReadModel>> {
    const statusFilter: Prisma.ReadingListWhereInput['status'] = Array.isArray(
      status,
    )
      ? { in: status }
      : status;
    const where: Prisma.ReadingListWhereInput = {
      userId,
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    return findPaginated(
      async () => {
        const rows = await this.transactionHost.tx.readingList.findMany({
          where,
          select: {
            id: true,
            userId: true,
            bookId: true,
            book: LIBRARY_ITEM_WITH_RELATIONS.book,
            status: true,
            lastReadChapterId: true,
            lastReadChapter: LIBRARY_ITEM_WITH_RELATIONS.lastReadChapter,
            collections: LIBRARY_ITEM_WITH_RELATIONS.collections,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          skip: page.offset,
          take: page.limit,
        });
        return rows.map((row) => toLibraryItemReadModel(row));
      },
      () => this.transactionHost.tx.readingList.count({ where }),
    );
  }
}
