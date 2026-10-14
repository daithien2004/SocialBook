import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import { CurrentUserReadRepository } from '../../../application/ports/current-user-read.repository';
import type { CurrentUserReadModel } from '../../../application/read-models/current-user.read-model';

@Injectable()
export class PrismaCurrentUserReadRepository extends CurrentUserReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  async findCurrentUser(
    ability: AppAbility,
    userId: string,
  ): Promise<CurrentUserReadModel | null> {
    const row = await this.transactionHost.tx.user.findFirst({
      where: {
        AND: [{ id: userId }, accessibleBy(ability).ofType('User')],
      },
      select: { id: true, username: true, image: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      image: row.image ?? undefined,
    };
  }
}
