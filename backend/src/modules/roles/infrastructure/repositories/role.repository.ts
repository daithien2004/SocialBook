import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@/core/database/generated/prisma/client';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { Role } from '../../domain/entities/role.entity';
import { RoleMapper } from './role.mapper';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  private get client(): Prisma.TransactionClient {
    return this.transactionHost.tx;
  }

  async findByName(name: string): Promise<Role | null> {
    const row = await this.client.role.findUnique({ where: { name } });
    return row ? RoleMapper.toDomain(row) : null;
  }

  async findById(id: string): Promise<Role | null> {
    const row = await this.client.role.findUnique({ where: { id } });
    return row ? RoleMapper.toDomain(row) : null;
  }
}
