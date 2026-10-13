import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { Collection } from '@/modules/library/domain/library/entities/collection.entity';
import { ICollectionRepository } from '@/modules/library/domain/library/repositories/collection.repository.interface';

@Injectable()
export class CollectionRepository implements ICollectionRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async save(collection: Collection): Promise<void> {
    const data = {
      userId: collection.userId.toString(),
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      updatedAt: collection.updatedAt,
    };
    await this.transactionHost.tx.libraryCollection.upsert({
      where: { id: collection.id },
      create: { id: collection.id, ...data, createdAt: collection.createdAt },
      update: data,
    });
  }

  async findById(id: string): Promise<Collection | null> {
    const row = await this.transactionHost.tx.libraryCollection.findUnique({
      where: { id },
    });
    return row ? toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Collection[]> {
    const rows = await this.transactionHost.tx.libraryCollection.findMany({
      where: { userId },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async findByUserIdAndName(
    userId: string,
    name: string,
  ): Promise<Collection | null> {
    const row = await this.transactionHost.tx.libraryCollection.findUnique({
      where: { userId_name: { userId, name } },
    });
    return row ? toDomain(row) : null;
  }

  async findByIds(ids: string[]): Promise<Collection[]> {
    if (ids.length === 0) return [];
    const rows = await this.transactionHost.tx.libraryCollection.findMany({
      where: { id: { in: ids } },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.transactionHost.tx.libraryCollection.deleteMany({
      where: { id },
    });
  }
}

function toDomain(row: Prisma.LibraryCollectionGetPayload<object>): Collection {
  return Collection.reconstitute({
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
