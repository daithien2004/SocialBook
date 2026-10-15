import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { AIRequest, IAIRequestRepository } from '@/modules/ai/domain';
import { AIRequestMapper } from './ai-request.mapper';

@Injectable()
export class AIRequestRepository implements IAIRequestRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async save(request: AIRequest): Promise<void> {
    const data = AIRequestMapper.toCreateInput(request);
    const { id, createdAt, ...update } = data;
    await this.transactionHost.tx.aIRequest.upsert({
      where: { id },
      create: data,
      update: { ...update, createdAt },
    });
  }
}
