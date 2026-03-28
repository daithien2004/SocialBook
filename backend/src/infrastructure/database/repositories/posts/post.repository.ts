import { CursorPaginatedResult } from '@/common/interfaces/pagination.interface';
import { Post as PostEntity } from '@/domain/posts/entities/post.entity';
import {
  FindAllOptions,
  FindFlaggedOptions,
  IPostRepository,
  PaginatedResult,
} from '@/domain/posts/repositories/post.repository.interface';
import { PostMapper } from '@/infrastructure/database/repositories/posts/post.mapper';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { CommentDocument } from '../../schemas/comment.schema';
import { LikeDocument } from '../../schemas/like.schema';
import { Post, PostDocument } from '../../schemas/post.schema';

const POPULATE_USER = { path: 'userId', select: 'username email image' };
const POPULATE_BOOK = {
  path: 'bookId',
  select: 'title slug coverUrl',
  populate: { path: 'authorId', select: 'name bio' },
};

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @InjectModel(Post.name) private readonly model: Model<PostDocument>,
    @InjectModel('Comment') private readonly commentModel: Model<CommentDocument>,
    @InjectModel('Like') private readonly likeModel: Model<LikeDocument>,
  ) { }

  async create(post: PostEntity): Promise<PostEntity> {
    const persistenceModel = PostMapper.toPersistence(post);
    const created = await this.model.create(persistenceModel);

    const populated = await this.model
      .findById(created._id)
      .populate(POPULATE_USER)
      .populate(POPULATE_BOOK)
      .exec();

    const domain = PostMapper.toDomain(populated as PostDocument);
    if (!domain) throw new Error('Failed to create post');
    return domain;
  }

  async update(post: PostEntity): Promise<PostEntity> {
    const persistenceModel = PostMapper.toPersistence(post);
    const updated = await this.model
      .findByIdAndUpdate(persistenceModel._id, persistenceModel, { new: true })
      .populate(POPULATE_USER)
      .populate(POPULATE_BOOK)
      .exec();

    if (!updated) throw new Error('Failed to update post');
    const domain = PostMapper.toDomain(updated as PostDocument);
    if (!domain) throw new Error('Failed to map updated post');
    return domain;
  }

  async findById(id: string, viewerUserId?: string): Promise<PostEntity | null> {
    const found = await this.model
      .findOne({ _id: id, isDeleted: false })
      .populate(POPULATE_USER)
      .populate(POPULATE_BOOK)
      .lean()
      .exec();
    if (!found) {
      return null;
    }

    const [enriched] = await this.enrichPosts([found], viewerUserId);
    return PostMapper.toDomain(enriched as PostDocument);
  }

  async findAll(options: FindAllOptions): Promise<CursorPaginatedResult<PostEntity>> {
    const filter: FilterQuery<PostDocument> = { isDeleted: false };

    if (options.userId) {
      filter.userId = new Types.ObjectId(options.userId);
    }
    if (options.isFlagged !== undefined) {
      filter.isFlagged = options.isFlagged;
    }
    if (options.cursor) {
      filter._id = { $lt: new Types.ObjectId(options.cursor) };
    }

    const docs = await this.model
      .find(filter)
      .sort({ _id: -1 })
      .limit(options.limit + 1)
      .populate(POPULATE_USER)
      .populate(POPULATE_BOOK)
      .lean()
      .exec();

    const hasMore = docs.length > options.limit;
    if (hasMore) docs.pop();

    const enrichedDocs = await this.enrichPosts(docs, options.viewerUserId);

    const data = enrichedDocs
      .map(doc => PostMapper.toDomain(doc as PostDocument))
      .filter((p): p is PostEntity => p !== null);

    return {
      data,
      nextCursor: hasMore ? docs[docs.length - 1]._id.toString() : null,
      hasMore,
    };
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.model
      .findByIdAndUpdate(id, { isDeleted: true, updatedAt: new Date() })
      .exec();
  }

  async findFlagged(options: FindFlaggedOptions): Promise<PaginatedResult<PostEntity>> {
    const filter = { isFlagged: true, isDeleted: false };
    const skip = (options.page - 1) * options.limit;

    const [result] = await this.model.aggregate([
      { $match: filter },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: options.limit },
          ],
        },
      },
    ]).exec();

    const total: number = result.metadata[0]?.total ?? 0;
    let documents = result.data;

    if (documents.length > 0) {
      documents = await this.model.populate(documents, [POPULATE_USER, POPULATE_BOOK]);
    }

    return {
      data: documents
        .map((doc: PostDocument) => PostMapper.toDomain(doc))
        .filter((p: PostEntity | null): p is PostEntity => p !== null),
      total,
    };
  }

  async countByUser(userId: string): Promise<number> {
    return this.model.countDocuments({ userId, isDeleted: false }).exec();
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.model
      .countDocuments({ _id: id, isDeleted: false })
      .exec();
    return count > 0;
  }

  async countTotal(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  async countActive(): Promise<number> {
    return this.model.countDocuments({ isDeleted: false }).exec();
  }

  async countDeleted(): Promise<number> {
    return this.model.countDocuments({ isDeleted: true }).exec();
  }

  async getGrowthMetrics(
    startDate: Date,
    groupBy: 'day' | 'month' | 'year',
  ): Promise<Array<{ _id: string; count: number }>> {
    const dateFormat =
      groupBy === 'month' ? '%Y-%m' : groupBy === 'year' ? '%Y' : '%Y-%m-%d';

    return this.model.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();
  }

  private async enrichPosts(
    docs: any[],
    viewerUserId?: string,
  ): Promise<any[]> {
    if (!docs.length) {
      return docs;
    }

    const postIds = docs.map((doc) => new Types.ObjectId(doc._id));
    const [commentCounts, likeCounts, likedDocs] = await Promise.all([
      this.commentModel.aggregate([
        {
          $match: {
            targetType: 'post',
            targetId: { $in: postIds },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$targetId',
            count: { $sum: 1 },
          },
        },
      ]).exec(),
      this.likeModel.aggregate([
        {
          $match: {
            targetType: 'post',
            targetId: { $in: postIds },
            status: true,
          },
        },
        {
          $group: {
            _id: '$targetId',
            count: { $sum: 1 },
          },
        },
      ]).exec(),
      viewerUserId
        ? this.likeModel.find({
          userId: new Types.ObjectId(viewerUserId),
          targetType: 'post',
          targetId: { $in: postIds },
          status: true,
        }).select('targetId').lean().exec()
        : Promise.resolve([] as Array<{ targetId: Types.ObjectId }>),
    ]);

    const commentCountMap = new Map(
      commentCounts.map((item) => [item._id.toString(), item.count as number])
    );
    const likeCountMap = new Map(
      likeCounts.map((item) => [item._id.toString(), item.count as number])
    );
    const likedPostIds = new Set(
      likedDocs.map((item) => item.targetId.toString())
    );

    return docs.map((doc) => ({
      ...doc,
      likesCount: likeCountMap.get(doc._id.toString()) ?? 0,
      commentsCount: commentCountMap.get(doc._id.toString()) ?? 0,
      likedByCurrentUser: viewerUserId
        ? likedPostIds.has(doc._id.toString())
        : false,
    }));
  }
}
