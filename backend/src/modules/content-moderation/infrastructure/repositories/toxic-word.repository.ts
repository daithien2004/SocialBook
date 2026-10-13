import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { IToxicWordRepository } from '@/modules/content-moderation/domain/repositories/toxic-word.repository.interface';
import { ToxicWord as ToxicWordEntity } from '@/modules/content-moderation/domain/entities/toxic-word.entity';
import { ToxicWordMapper } from './toxic-word.mapper';

@Injectable()
export class ToxicWordRepository implements IToxicWordRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async create(word: ToxicWordEntity): Promise<ToxicWordEntity> {
    const row = await this.transactionHost.tx.toxicWord.create({
      data: ToxicWordMapper.toCreateInput(word),
    });
    return ToxicWordMapper.toDomain(row);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.transactionHost.tx.toxicWord.deleteMany({
      where: { id },
    });
    return result.count > 0;
  }

  async findAll(): Promise<ToxicWordEntity[]> {
    const rows = await this.transactionHost.tx.toxicWord.findMany({
      orderBy: [{ pattern: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => ToxicWordMapper.toDomain(row));
  }

  async existsByPattern(pattern: string): Promise<boolean> {
    const row = await this.transactionHost.tx.toxicWord.findUnique({
      where: { pattern },
      select: { id: true },
    });
    return row !== null;
  }
}
