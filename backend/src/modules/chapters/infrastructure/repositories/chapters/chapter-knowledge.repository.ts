import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { IChapterKnowledgeRepository } from '@/modules/chapters/domain/chapters/repositories/chapter-knowledge.repository.interface';
import { ChapterKnowledge } from '@/modules/chapters/domain/chapters/entities/chapter-knowledge.entity';
import { ChapterKnowledgeMapper } from './chapter-knowledge.mapper';

@Injectable()
export class ChapterKnowledgeRepository implements IChapterKnowledgeRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async findByChapterId(chapterId: string): Promise<ChapterKnowledge | null> {
    const row = await this.transactionHost.tx.chapterKnowledge.findUnique({
      where: { chapterId },
    });
    return row ? ChapterKnowledgeMapper.toDomain(row) : null;
  }

  async save(knowledge: ChapterKnowledge): Promise<void> {
    const data = ChapterKnowledgeMapper.toCreateInput(knowledge);
    const { id, chapterId, createdAt, ...update } = data;
    await this.transactionHost.tx.chapterKnowledge.upsert({
      where: { chapterId },
      create: data,
      update: { ...update, id, createdAt },
    });
  }

  async delete(id: string): Promise<void> {
    await this.transactionHost.tx.chapterKnowledge.deleteMany({
      where: { id },
    });
  }
}
