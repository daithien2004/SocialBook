import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import {
  ReadingList,
  ReadingStatus,
} from '@/modules/library/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/modules/library/domain/library/read-models/library-item.read-model';
import { IReadingListRepository } from '@/modules/library/domain/library/repositories/reading-list.repository.interface';
import { BookId } from '@/modules/library/domain/library/value-objects/book-id.vo';
import { UserId } from '@/modules/library/domain/library/value-objects/user-id.vo';
import {
  LIBRARY_ITEM_WITH_RELATIONS,
  READING_LIST_WITH_RELATIONS,
  toLibraryItemReadModel,
  toReadingListDomain,
} from './library.mapper';

@Injectable()
export class ReadingListRepository implements IReadingListRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async save(readingList: ReadingList): Promise<void> {
    const collectionConnections = readingList.collectionIds.map(
      (collectionId) => ({
        collection: { connect: { id: collectionId } },
      }),
    );
    const scalarData = {
      userId: readingList.userId.toString(),
      bookId: readingList.bookId.toString(),
      status: readingList.status,
      lastReadChapterId: readingList.lastReadChapterId?.toString() ?? null,
      updatedAt: readingList.updatedAt,
    };

    await this.transactionHost.tx.readingList.upsert({
      where: { id: readingList.id },
      create: {
        id: readingList.id,
        ...scalarData,
        createdAt: readingList.createdAt,
        collections: { create: collectionConnections },
      },
      update: {
        ...scalarData,
        collections: {
          deleteMany: {},
          create: collectionConnections,
        },
      },
    });
  }

  async findByUserIdAndBookId(
    userId: UserId,
    bookId: BookId,
  ): Promise<ReadingList | null> {
    const row = await this.transactionHost.tx.readingList.findUnique({
      where: {
        userId_bookId: {
          userId: userId.toString(),
          bookId: bookId.toString(),
        },
      },
      include: READING_LIST_WITH_RELATIONS,
    });
    return row ? toReadingListDomain(row) : null;
  }

  async remove(userId: UserId, bookId: BookId): Promise<void> {
    await this.transactionHost.tx.readingList.deleteMany({
      where: { userId: userId.toString(), bookId: bookId.toString() },
    });
  }

  async exists(userId: UserId, bookId: BookId): Promise<boolean> {
    const count = await this.transactionHost.tx.readingList.count({
      where: { userId: userId.toString(), bookId: bookId.toString() },
    });
    return count > 0;
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
    userId: UserId,
    bookId: BookId,
  ): Promise<LibraryItemReadModel | null> {
    const row = await this.transactionHost.tx.readingList.findUnique({
      where: {
        userId_bookId: {
          userId: userId.toString(),
          bookId: bookId.toString(),
        },
      },
      include: LIBRARY_ITEM_WITH_RELATIONS,
    });
    return row ? toLibraryItemReadModel(row) : null;
  }

  async findAllDetailByUserId(
    userId: UserId,
    status?: ReadingStatus | ReadingStatus[],
    limit?: number,
  ): Promise<LibraryItemReadModel[]> {
    const statusFilter: Prisma.ReadingListWhereInput['status'] = Array.isArray(
      status,
    )
      ? { in: status }
      : status;
    const rows = await this.transactionHost.tx.readingList.findMany({
      where: {
        userId: userId.toString(),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: LIBRARY_ITEM_WITH_RELATIONS,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      ...(limit ? { take: limit } : {}),
    });
    return rows.map((row) => toLibraryItemReadModel(row));
  }
}
