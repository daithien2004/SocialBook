import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { CollectionReadRepository } from '@/modules/library/application/ports/collection-read.repository';
import type { CollectionReadModel } from '@/modules/library/application/read-models/collection.read-model';
import type { AppAbility } from '@/shared/casl/app-ability';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';

@Injectable()
export class PrismaCollectionReadRepository extends CollectionReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  async findPage(
    ability: AppAbility,
    userId: string | undefined,
    page: PageParams,
  ): Promise<PageResult<CollectionReadModel>> {
    const where: Prisma.LibraryCollectionWhereInput = {
      AND: [
        accessibleBy(ability).ofType('LibraryCollection'),
        ...(userId ? [{ userId }] : []),
      ],
    };

    return findPaginated(
      async () => {
        const rows = await this.transactionHost.tx.libraryCollection.findMany({
          where,
          select: {
            id: true,
            name: true,
            description: true,
            isPublic: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { readingLists: true } },
          },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip: page.offset,
          take: page.limit,
        });
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          isPublic: row.isPublic,
          userId: row.userId,
          bookCount: row._count.readingLists,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      },
      () => this.transactionHost.tx.libraryCollection.count({ where }),
    );
  }
}
