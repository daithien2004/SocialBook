import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { AIRequest, IAIRequestRepository } from '@/modules/ai/domain';
import { AIRequestMapper } from './ai-request.mapper';

@Injectable()
export class AIRequestRepository implements IAIRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(request: AIRequest): Promise<void> {
    const data = AIRequestMapper.toCreateInput(request);
    const { id, createdAt, ...update } = data;
    await this.prisma.aIRequest.upsert({
      where: { id },
      create: data,
      update: { ...update, createdAt },
    });
  }
}
