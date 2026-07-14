import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserHighlight } from '@/domain/user-highlights/entities/user-highlight.entity';
import { IUserHighlightRepository } from '@/domain/user-highlights/repositories/user-highlight.repository.interface';
import {
  UserHighlightDocument,
  UserHighlight as UserHighlightSchema,
} from '../../schemas/user-highlight.schema';
import { UserHighlightMapper } from './user-highlight.mapper';

@Injectable()
export class UserHighlightRepository implements IUserHighlightRepository {
  constructor(
    @InjectModel(UserHighlightSchema.name)
    private readonly highlightModel: Model<UserHighlightDocument>,
  ) {}

  async save(highlight: UserHighlight): Promise<void> {
    const data = UserHighlightMapper.toPersistence(highlight);
    if (Types.ObjectId.isValid(highlight.id)) {
      await this.highlightModel.findByIdAndUpdate(
        highlight.id,
        { $set: data },
        { upsert: true, new: true },
      );
    } else {
      // If it's a new entity, create it
      await this.highlightModel.create(data);
      // We don't update the entity ID here because Entity base class has readonly ID.
      // In a real CQRS, we might pass generated IDs or use UUIDs in the domain.
      // But this works for NestJS/Mongoose flow where domain is created first.
    }
  }

  async findById(id: string): Promise<UserHighlight | null> {
    const doc = await this.highlightModel.findById(id).exec();
    return doc ? UserHighlightMapper.toDomain(doc) : null;
  }

  async findByBookId(userId: string, bookId: string): Promise<UserHighlight[]> {
    const docs = await this.highlightModel
      .find({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      })
      .sort({ createdAt: 1 })
      .exec();
    return docs.map((doc) => UserHighlightMapper.toDomain(doc));
  }

  async findByChapterId(
    userId: string,
    chapterId: string,
  ): Promise<UserHighlight[]> {
    const docs = await this.highlightModel
      .find({
        userId: new Types.ObjectId(userId),
        chapterId: new Types.ObjectId(chapterId),
      })
      .sort({ createdAt: 1 })
      .exec();
    return docs.map((doc) => UserHighlightMapper.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await this.highlightModel.findByIdAndDelete(id).exec();
  }
}
