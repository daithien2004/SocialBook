import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { ReadingList } from '@/modules/library/domain/library/entities/reading-list.entity';
import { IReadingListRepository } from '@/modules/library/domain/library/repositories/reading-list.repository.interface';
import { BookId } from '@/modules/library/domain/library/value-objects/book-id.vo';
import { UserId } from '@/modules/library/domain/library/value-objects/user-id.vo';
import {
  READING_LIST_WITH_RELATIONS,
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
}
