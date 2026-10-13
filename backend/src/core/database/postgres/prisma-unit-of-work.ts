import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { PrismaTransactionalAdapter } from './prisma-transaction.types';

@Injectable()
export class PrismaUnitOfWork extends UnitOfWorkPort {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  execute<T>(operation: () => Promise<T>): Promise<T> {
    return this.transactionHost.withTransaction(operation);
  }
}
