import { CursorPaginatedResult } from '@/common/interfaces/pagination.interface';
import { Post as PostEntity } from '@/domain/posts/entities/post.entity';
import {
  FindAllOptions,
  FindFlaggedOptions,
  IPostRepository,
  PaginatedResult,
} from '@/domain/posts/repositories/post.repository.interface';
import { PostMapper } from '@/infrastructure/database/repositories/posts/post.mapper';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, PipelineStage } from 'mongoose';
import { CommentDocument } from '../../schemas/comment.schema';
import { LikeDocument } from '../../schemas/like.schema';
import { Post, PostDocument } from '../../schemas/post.schema';

const POPULATE_USER = {
  path: 'userId',
  select: 'username email image violationCount',
};
const POPULATE_BOOK = {
  path: 'bookId',
  select: 'title slug coverUrl',
  populate: { path: 'authorId', select: 'name bio' },
};

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @InjectModel(Post.name) private readonly model: Model<PostDocument>,
    @InjectModel('Comment')
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel('Like') private readonly likeModel: Model<LikeDocument>,
  ) {}

  async create(post: PostEntity): Promise<PostEntity> {
    const created = await this.model.create(PostMapper.toPersistence(post));

    const populated = await this.model
      .findById(created._id)
      .populate(POPULATE_USER)
      .populate(POPULATE_BOOK)
      .exec();

    const domain = PostMapper.toDomain(populated as PostDocument);
    if (!domain)
      throw new InternalServerErrorException('Failed to create post');
    return domain;
  }

  async update(post: PostEntity): Promise<PostEntity> {
    const persistenceModel = PostMapper.toPersistence(post);
    const updated = await this.model
      .findByIdAndUpdate(persistenceModel._id, persistenceModel, { new: true })
      .populate(POPULATE_USER)
      .populate(POPULATE_BOOK)
      .exec();

    if (!updated)
      throw new InternalServerErrorException('Failed to update post');
    const domain = PostMapper.toDomain(updated as PostDocument);
    if (!domain)
      throw new InternalServerErrorException('Failed to map updated post');
    return domain;
  }

  async findById(
    id: string,
    viewerUserId?: string,
  ): Promise<PostEntity | null> {
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
    return PostMapper.toDomain(enriched);
  }

  async findAll(
    options: FindAllOptions,
  ): Promise<CursorPaginatedResult<PostEntity>> {
    if (options.userId || !options.viewerUserId) {
      const filter: FilterQuery<PostDocument> = { isDeleted: false };

      if (options.userId) {
        filter.userId = new Types.ObjectId(options.userId);
      }
      if (options.cursor) {
        const cursorId = options.cursor.includes('_')
          ? options.cursor.split('_')[1]
          : options.cursor;

        if (Types.ObjectId.isValid(cursorId)) {
          filter._id = { $lt: new Types.ObjectId(cursorId) };
        }
      }

      if (options.isFlagged !== undefined) {
        filter.isFlagged = options.isFlagged;
      } else if (!(options.userId && options.viewerUserId === options.userId)) {
        filter.isFlagged = { $ne: true };
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
        .map((doc) => PostMapper.toDomain(doc))
        .filter((p): p is PostEntity => p !== null);

      return {
        data,
        nextCursor: hasMore ? docs[docs.length - 1]._id.toString() : null,
        hasMore,
      };
    }

    // Otherwise, we calculate the personalized feed!
    const viewerObjId = new Types.ObjectId(options.viewerUserId);

    interface PostAggregationResult {
      score: number;
      likesCount: number;
      commentsCount: number;
      genreScore: number;
      followScore: number;
      engagementScore: number;
      hoursAge: number;
    }

    type PostAggregateDoc = PostDocument & PostAggregationResult;

    let cursorScore: number | null = null;
    let cursorId: string | null = null;

    if (options.cursor) {
      if (options.cursor.includes('_')) {
        const parts = options.cursor.split('_');
        cursorScore = parseFloat(parts[0]);
        cursorId = parts[1];
      } else if (Types.ObjectId.isValid(options.cursor)) {
        cursorId = options.cursor;
        const legacyPost = await this.model.findById(cursorId).lean().exec();
        if (legacyPost) {
          const hoursAge =
            (Date.now() - new Date(legacyPost.createdAt).getTime()) / 3600000;
          cursorScore = 1 / Math.pow(hoursAge + 2, 1.5);
        } else {
          cursorScore = 0;
        }
      }
    }

    const pipeline: PipelineStage[] = [
      { $match: { isDeleted: false, isFlagged: { $ne: true } } },
      // 1. Lookup likes count
      {
        $lookup: {
          from: 'likes',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$targetId', '$$postId'] },
                    { $eq: ['$targetType', 'post'] },
                    { $eq: ['$status', true] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'likesInfo',
        },
      },
      // 2. Lookup comments count
      {
        $lookup: {
          from: 'comments',
          let: { postId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$targetId', '$$postId'] },
                    { $eq: ['$targetType', 'post'] },
                    { $eq: ['$isDeleted', false] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'commentsInfo',
        },
      },
      // 3. Lookup book info
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: '_id',
          as: 'bookInfo',
        },
      },
      // 4. Lookup user preferences
      {
        $lookup: {
          from: 'user_preferences',
          let: {
            bookGenres: {
              $ifNull: [{ $arrayElemAt: ['$bookInfo.genres', 0] }, []],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', viewerObjId] },
                    { $in: ['$genreId', '$$bookGenres'] },
                  ],
                },
              },
            },
          ],
          as: 'prefInfo',
        },
      },
      // 5. Lookup follow info
      {
        $lookup: {
          from: 'follows',
          let: { authorId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', viewerObjId] },
                    { $eq: ['$targetId', '$$authorId'] },
                    { $eq: ['$status', true] },
                    { $eq: ['$isDeleted', false] },
                  ],
                },
              },
            },
          ],
          as: 'followInfo',
        },
      },
      // 6. Compute scores
      {
        $addFields: {
          likesCount: {
            $ifNull: [{ $arrayElemAt: ['$likesInfo.count', 0] }, 0],
          },
          commentsCount: {
            $ifNull: [{ $arrayElemAt: ['$commentsInfo.count', 0] }, 0],
          },
          genreScore: { $sum: '$prefInfo.score' },
          followScore: {
            $cond: {
              if: { $gt: [{ $size: '$followInfo' }, 0] },
              then: 100,
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          engagementScore: {
            $add: ['$likesCount', { $multiply: ['$commentsCount', 3] }],
          },
          hoursAge: {
            $divide: [{ $subtract: [new Date(), '$createdAt'] }, 3600000],
          },
        },
      },
      {
        $addFields: {
          score: {
            $divide: [
              { $add: ['$followScore', '$genreScore', '$engagementScore', 1] },
              { $pow: [{ $add: ['$hoursAge', 2] }, 1.5] },
            ],
          },
        },
      },
    ];

    // Filter by cursor
    if (cursorScore !== null && cursorId !== null) {
      pipeline.push({
        $match: {
          $or: [
            { score: { $lt: cursorScore } },
            { score: cursorScore, _id: { $lt: new Types.ObjectId(cursorId) } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { score: -1, _id: -1 } });
    pipeline.push({ $limit: options.limit + 1 });

    const aggDocs = await this.model
      .aggregate<PostAggregateDoc>(pipeline)
      .exec();

    if (aggDocs.length > 0) {
      const logger = new Logger(PostRepository.name);
      logger.debug(
        `Personalized feed: ${aggDocs.length} posts fetched (score sample: ${aggDocs[0]?.score ?? 'N/A'})`,
      );
    }

    let docs: PostDocument[] = [];
    if (aggDocs.length > 0) {
      docs = await this.model.populate(aggDocs, [POPULATE_USER, POPULATE_BOOK]);
    }

    const hasMore = docs.length > options.limit;
    if (hasMore) docs.pop();

    const enrichedDocs = await this.enrichPosts(docs, options.viewerUserId);

    const data = enrichedDocs
      .map((doc) => PostMapper.toDomain(doc))
      .filter((p): p is PostEntity => p !== null);

    return {
      data,
      nextCursor: hasMore
        ? `${aggDocs[aggDocs.length - 1].score}_${aggDocs[aggDocs.length - 1]._id.toString()}`
        : null,
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

  async findFlagged(
    options: FindFlaggedOptions,
  ): Promise<PaginatedResult<PostEntity>> {
    const filter: FilterQuery<PostDocument> = {
      isFlagged: true,
      isDeleted: false,
    };
    if (options.reason) {
      filter.moderationReason = { $regex: options.reason, $options: 'i' };
    }
    const skip = (options.page - 1) * options.limit;

    const facetResult = await this.model
      .aggregate<{ metadata: Array<{ total: number }>; data: PostDocument[] }>([
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
      ])
      .exec();

    const result = facetResult[0] ?? { metadata: [], data: [] };
    const total: number = result.metadata[0]?.total ?? 0;
    let documents = result.data;

    if (documents.length > 0) {
      documents = await this.model.populate(documents, [
        POPULATE_USER,
        POPULATE_BOOK,
      ]);
    }

    return {
      data: documents
        .map((doc: PostDocument) => PostMapper.toDomain(doc))
        .filter((p: PostEntity | null): p is PostEntity => p !== null),
      total,
    };
  }

  async countByUser(userId: string): Promise<number> {
    return this.model
      .countDocuments({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
        isFlagged: false,
      })
      .exec();
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

    return this.model
      .aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
  }

  private async enrichPosts(
    docs: PostDocument[],
    viewerUserId?: string,
  ): Promise<PostDocument[]> {
    if (!docs.length) {
      return docs;
    }

    const postIds = docs.map((doc) => new Types.ObjectId(doc._id));
    const [commentCounts, likeCounts, likedDocs] = await Promise.all([
      this.commentModel
        .aggregate<{ _id: Types.ObjectId; count: number }>([
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
        ])
        .exec(),
      this.likeModel
        .aggregate<{ _id: Types.ObjectId; count: number }>([
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
        ])
        .exec(),
      viewerUserId
        ? this.likeModel
            .find({
              userId: new Types.ObjectId(viewerUserId),
              targetType: 'post',
              targetId: { $in: postIds },
              status: true,
            })
            .select('targetId')
            .lean()
            .exec()
        : Promise.resolve([] as Array<{ targetId: Types.ObjectId }>),
    ]);

    const commentCountMap = new Map<string, number>(
      commentCounts.map((item) => [item._id.toString(), item.count]),
    );
    const likeCountMap = new Map<string, number>(
      likeCounts.map((item) => [item._id.toString(), item.count]),
    );
    const likedPostIds = new Set(
      likedDocs.map((item) => item.targetId.toString()),
    );

    return docs.map((doc) => {
      return {
        ...doc,
        likesCount: likeCountMap.get(doc._id.toString()) ?? 0,
        commentsCount: commentCountMap.get(doc._id.toString()) ?? 0,
        likedByCurrentUser: viewerUserId
          ? likedPostIds.has(doc._id.toString())
          : false,
      } as unknown as PostDocument;
    });
  }
}
