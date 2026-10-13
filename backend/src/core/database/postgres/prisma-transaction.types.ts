import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PrismaClient } from '../generated/prisma/client';

export type PrismaTransactionalAdapter =
  TransactionalAdapterPrisma<PrismaClient>;
export type PrismaTransactionClient =
  TransactionHost<PrismaTransactionalAdapter>['tx'];
