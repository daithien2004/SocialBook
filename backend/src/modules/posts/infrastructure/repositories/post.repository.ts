import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema'; // Import from local infra schema
import { IPostRepository, FindAllOptions, PaginatedResult } from '../../domain/repositories/post.repository.interface';
import { Post as PostEntity } from '../../domain/entities/post.entity';
import { PostMapper } from '../mappers/post.mapper';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(@InjectModel(Post.name) private readonly model: Model<PostDocument>) {}

  async create(post: PostEntity): Promise<PostEntity> {
    const persistenceModel = PostMapper.toPersistence(post);
    const created = await this.model.create(persistenceModel);
    
    // Fetch populated to return full entity
    const populated = await this.model.findById(created._id)
        .populate('userId', 'username email image')
        .populate({
            path: 'bookId',
            select: 'title coverUrl',
            populate: { path: 'authorId', select: 'name bio' }
        })
        .exec();

    const domain = PostMapper.toDomain(populated as PostDocument);
    if (!domain) throw new Error('Failed to create post');
    return domain;
  }

  async update(post: PostEntity): Promise<PostEntity> {
    const persistenceModel = PostMapper.toPersistence(post);
    const updated = await this.model
      .findByIdAndUpdate(persistenceModel._id, persistenceModel, { new: true })
      .populate('userId', 'username email image')
      .populate({
          path: 'bookId',
          select: 'title coverUrl',
          populate: { path: 'authorId', select: 'name bio' }
      })
      .exec();
    
    if (!updated) throw new Error('Failed to update post');
    
    const domain = PostMapper.toDomain(updated as PostDocument);
    if (!domain) throw new Error('Failed to map updated post');
    return domain;
  }

  async findById(id: string): Promise<PostEntity | null> {
    const found = await this.model.findOne({ _id: id, isDelete: false })
        .populate('userId', 'username email image')
        .populate({
            path: 'bookId',
            select: 'title coverUrl',
            populate: { path: 'authorId', select: 'name bio' }
        })
        .exec();
    return PostMapper.toDomain(found as PostDocument);
  }

  async findAll(options: FindAllOptions): Promise<PaginatedResult<PostEntity>> {
    const filter: FilterQuery<PostDocument> = { isDelete: false };
    if (options.userId) {
      filter.userId = options.userId; // Types handled by mongoose casting string to ObjectId usually works, but safer to cast if needed. Schema defines it as ObjectId. Mongoose auto casts string to ObjectId in query.
    }
    if (options.isFlagged !== undefined) {
      filter.isFlagged = options.isFlagged;
    }

    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .populate('userId', 'username email image')
        .populate({
            path: 'bookId',
            select: 'title coverUrl',
            populate: { path: 'authorId', select: 'name bio' }
        })
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map((doc) => PostMapper.toDomain(doc)).filter((p): p is PostEntity => p !== null),
      total,
    };
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { isDelete: true, updatedAt: new Date() }).exec();
  }

  async findFlagged(skip: number, limit: number): Promise<PaginatedResult<PostEntity>> {
    const filter = { isFlagged: true, isDelete: false };
    const [docs, total] = await Promise.all([
      this.model.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email image')
        .populate({
            path: 'bookId',
            select: 'title coverUrl',
            populate: { path: 'authorId', select: 'name bio' }
        })
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return {
      data: docs.map((doc) => PostMapper.toDomain(doc)).filter((p): p is PostEntity => p !== null),
      total,
    };
  }

  async countByUser(userId: string): Promise<number> {
      return this.model.countDocuments({ userId, isDelete: false }).exec();
  }

  async exists(id: string): Promise<boolean> {
      const count = await this.model.countDocuments({ _id: id, isDelete: false }).exec();
      return count > 0;
  }

  // Statistics
  async countTotal(): Promise<number> {
      return this.model.countDocuments().exec();
  }

  async countActive(): Promise<number> {
      return this.model.countDocuments({ isDelete: false }).exec();
  }

  async countDeleted(): Promise<number> {
      return this.model.countDocuments({ isDelete: true }).exec();
  }

  async getGrowthMetrics(startDate: Date, groupBy: 'day' | 'month' | 'year'): Promise<Array<{ _id: string; count: number }>> {
      let dateFormat: string;
       switch (groupBy) {
          case 'month': dateFormat = '%Y-%m'; break;
          case 'year': dateFormat = '%Y'; break;
          case 'day': default: dateFormat = '%Y-%m-%d'; break;
      }

      return await this.model.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
              $group: {
                  _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                  count: { $sum: 1 }
              }
          },
          { $sort: { _id: 1 } }
      ]).exec();
  }
}
