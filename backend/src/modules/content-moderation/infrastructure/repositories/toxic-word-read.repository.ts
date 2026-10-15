import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import type { AppAbility } from '@/shared/casl/app-ability';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { PageParams, PageResult } from '@/shared/domain/pagination.types';
import { findPaginated } from '@/shared/infrastructure/database/find-paginated';
import { ToxicWordReadRepository } from '@/modules/content-moderation/application/ports/toxic-word-read.repository';
import type { ToxicWordReadModel } from '@/modules/content-moderation/application/read-models/toxic-word.read-model';

@Injectable()
export class PrismaToxicWordReadRepository extends ToxicWordReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  private get client(): Prisma.TransactionClient {
    return this.transactionHost.tx;
  }

  async findPage(
    ability: AppAbility,
    search: string | undefined,
    page: PageParams,
  ): Promise<PageResult<ToxicWordReadModel>> {
    const where: Prisma.ToxicWordWhereInput = {
      AND: [
        accessibleBy(ability).ofType('ToxicWord'),
        search
          ? {
              OR: [
                { pattern: { contains: search, mode: 'insensitive' } },
                { originalWord: { contains: search, mode: 'insensitive' } },
                { group: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    return findPaginated(
      () =>
        this.client.toxicWord.findMany({
          where,
          select: {
            id: true,
            pattern: true,
            group: true,
            originalWord: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ pattern: 'asc' }, { id: 'asc' }],
          skip: page.offset,
          take: page.limit,
        }),
      () => this.client.toxicWord.count({ where }),
    );
  }
}
