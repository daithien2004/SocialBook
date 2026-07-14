import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IToxicWordRepository } from '@/domain/content-moderation/repositories/toxic-word.repository.interface';
import { ToxicWord } from '@/domain/content-moderation/entities/toxic-word.entity';
import { ToxicWordDocument } from '@/infrastructure/database/schemas/toxic-word.schema';

@Injectable()
export class ToxicWordRepository implements IToxicWordRepository {
  constructor(
    @InjectModel('ToxicWord')
    private readonly toxicWordModel: Model<ToxicWordDocument>,
  ) {}

  async create(word: ToxicWord): Promise<ToxicWord> {
    const created = new this.toxicWordModel({
      _id: word.id,
      pattern: word.pattern,
      group: word.group,
      originalWord: word.originalWord,
    });
    const saved = await created.save();
    return this.toEntity(saved);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.toxicWordModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findAll(): Promise<ToxicWord[]> {
    const documents = await this.toxicWordModel.find().exec();
    return documents.map((doc) => this.toEntity(doc));
  }

  async existsByPattern(pattern: string): Promise<boolean> {
    const count = await this.toxicWordModel.countDocuments({ pattern }).exec();
    return count > 0;
  }

  private toEntity(doc: ToxicWordDocument): ToxicWord {
    return ToxicWord.reconstitute({
      id: String(doc._id),
      pattern: doc.pattern,
      group: doc.group,
      originalWord: doc.originalWord,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
