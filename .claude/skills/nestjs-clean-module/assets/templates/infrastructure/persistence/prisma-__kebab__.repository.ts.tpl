import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { __Name__ } from '../../domain/entities/__kebab__.entity';
import { __Name__Repository } from '../../domain/repositories/__kebab__.repository';
import { __Name__Mapper } from './__kebab__.mapper';

@Injectable()
export class Prisma__Name__Repository extends __Name__Repository {
  // Lấy client từ TransactionHost (không inject PrismaService) để tự tham gia transaction của handler.
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.txHost.tx;
  }

  async findById(id: string): Promise<__Name__ | null> {
    const row = await this.db.__name__.findFirst({ where: { id, deletedAt: null } });
    return row ? __Name__Mapper.toDomain(row) : null;
  }

  async save(entity: __Name__): Promise<void> {
    const { id, ...rest } = __Name__Mapper.toPersistence(entity);
    // Dịch lỗi Prisma (P2002, P2025...) thành domain error tại đây khi cần.
    await this.db.__name__.upsert({ where: { id }, create: { id, ...rest }, update: rest });
  }
}
