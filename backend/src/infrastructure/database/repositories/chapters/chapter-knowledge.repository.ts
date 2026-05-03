import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IChapterKnowledgeRepository } from '@/domain/chapters/repositories/chapter-knowledge.repository.interface';
import { ChapterKnowledge as ChapterKnowledgeEntity } from '@/domain/chapters/entities/chapter-knowledge.entity';
import { ChapterKnowledge as ChapterKnowledgeSchema, ChapterKnowledgeDocument } from '../../schemas/chapter-knowledge.schema';
import { ChapterKnowledgeMapper } from './chapter-knowledge.mapper';

@Injectable()
export class ChapterKnowledgeRepository implements IChapterKnowledgeRepository {
  constructor(
    @InjectModel(ChapterKnowledgeSchema.name)
    private readonly model: Model<ChapterKnowledgeDocument>,
  ) {}

  async findByChapterId(chapterId: string): Promise<ChapterKnowledgeEntity | null> {
    const doc = await this.model.findOne({ chapterId }).exec();
    if (!doc) return null;
    return ChapterKnowledgeMapper.toDomain(doc);
  }

  async save(knowledge: ChapterKnowledgeEntity): Promise<void> {
    const persistence = ChapterKnowledgeMapper.toPersistence(knowledge);
    await this.model.findByIdAndUpdate(
      persistence._id,
      { $set: persistence },
      { upsert: true, new: true },
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}
