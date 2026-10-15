import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { UserHighlight } from '@/modules/user-highlights/domain/entities/user-highlight.entity';
import { IUserHighlightRepository } from '@/modules/user-highlights/domain/repositories/user-highlight.repository.interface';
import { UserHighlightMapper } from './user-highlight.mapper';

@Injectable()
export class UserHighlightRepository implements IUserHighlightRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async save(highlight: UserHighlight): Promise<void> {
    await this.transactionHost.tx.userHighlight.upsert({
      where: { id: highlight.id },
      create: UserHighlightMapper.toCreateInput(highlight),
      update: {
        content: highlight.content,
        color: highlight.color,
        note: highlight.note ?? null,
        updatedAt: highlight.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<UserHighlight | null> {
    const row = await this.transactionHost.tx.userHighlight.findUnique({
      where: { id },
    });
    return row ? UserHighlightMapper.toDomain(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.transactionHost.tx.userHighlight.deleteMany({ where: { id } });
  }
}
