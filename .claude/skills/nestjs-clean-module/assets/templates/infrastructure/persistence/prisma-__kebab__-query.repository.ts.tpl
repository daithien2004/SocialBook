import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '__PRISMA_IMPORT__';
import { accessibleBy } from '@/shared/casl/accessible-by';
import { AppAbility } from '@/shared/casl/app-ability';
import { Page, PageQuery } from '@/shared/domain/page';
import {
  List__Names__Filter,
  __Name__QueryRepository,
} from '../../application/ports/__kebab__-query.repository';
import { __Name__ReadModel } from '../../application/read-models/__kebab__.read-model';
import { __Name__Mapper } from './__kebab__.mapper';

// Luôn select đúng cột cần, không lấy cả bản ghi.
const listSelect = {
  id: true,
  ownerId: true,
  title: true,
  createdAt: true,
} satisfies Prisma.__Name__Select;

@Injectable()
export class Prisma__Name__QueryRepository extends __Name__QueryRepository {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) {
    super();
  }

  private get db() {
    return this.txHost.tx;
  }

  async findAccessible(
    ability: AppAbility,
    filter: List__Names__Filter,
    page: PageQuery,
  ): Promise<Page<__Name__ReadModel>> {
    // Điều kiện quyền luôn đứng trong AND cùng filter của user; filter của user không bao giờ ghi đè quyền.
    const where: Prisma.__Name__WhereInput = {
      AND: [
        accessibleBy(ability).__Name__,
        { deletedAt: null },
        filter.search ? { title: { contains: filter.search, mode: 'insensitive' } } : {},
      ],
    };
    const [rows, total] = await Promise.all([
      this.db.__name__.findMany({
        where,
        select: listSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page.page - 1) * page.limit,
        take: page.limit,
      }),
      this.db.__name__.count({ where }),
    ]);
    return {
      items: rows.map(__Name__Mapper.toReadModel),
      total,
      page: page.page,
      limit: page.limit,
    };
  }

  async findAccessibleById(ability: AppAbility, id: string): Promise<__Name__ReadModel | null> {
    const row = await this.db.__name__.findFirst({
      where: { AND: [accessibleBy(ability).__Name__, { id, deletedAt: null }] },
      select: listSelect,
    });
    return row ? __Name__Mapper.toReadModel(row) : null;
  }
}
