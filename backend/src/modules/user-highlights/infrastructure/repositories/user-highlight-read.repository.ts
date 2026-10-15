import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { UserHighlightReadModel } from '../../application/user-highlight.read-model';
import type { UserHighlightFilter } from '../../application/ports/user-highlight-read.repository';
import { UserHighlightReadRepository } from '../../application/ports/user-highlight-read.repository';
import { Prisma } from '@/core/database/generated/prisma/client';

type UserHighlightRow = Prisma.UserHighlightModel;

@Injectable()
export class PrismaUserHighlightReadRepository extends UserHighlightReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  async findPageForUser(
    ability: AppAbility,
    userId: string,
    filter: UserHighlightFilter,
    limit: number,
    offset: number,
  ): Promise<PageResult<UserHighlightReadModel>> {
    const where = {
      AND: [
        accessibleBy(ability).ofType('UserHighlight'),
        { userId },
        ...(filter.bookId ? [{ bookId: filter.bookId }] : []),
        ...(filter.chapterId ? [{ chapterId: filter.chapterId }] : []),
      ],
    };
    const [rows, total] = await Promise.all([
      this.transactionHost.tx.userHighlight.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: limit,
      }),
      this.transactionHost.tx.userHighlight.count({ where }),
    ]);
    return { items: rows.map((row) => this.toReadModel(row)), total };
  }

  async findAccessibleById(
    ability: AppAbility,
    id: string,
  ): Promise<UserHighlightReadModel | null> {
    const row = await this.transactionHost.tx.userHighlight.findFirst({
      where: {
        AND: [{ id }, accessibleBy(ability).ofType('UserHighlight')],
      },
    });
    return row ? this.toReadModel(row) : null;
  }

  private toReadModel(row: UserHighlightRow): UserHighlightReadModel {
    return {
      id: row.id,
      userId: row.userId,
      bookId: row.bookId,
      chapterId: row.chapterId,
      paragraphId: row.paragraphId,
      content: row.content,
      color: row.color,
      note: row.note,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
