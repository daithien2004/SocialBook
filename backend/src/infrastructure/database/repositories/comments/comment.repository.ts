import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/common/interfaces/pagination.interface';
import { Comment as CommentEntity } from '@/domain/comments/entities/comment.entity';
import { CommentModel } from '@/domain/comments/read-models/comment-model';
import {
  CommentFilter,
  CommentReplies,
  ICommentRepository,
  ParentResolutionResult,
} from '@/domain/comments/repositories/comment.repository.interface';
import { CommentDepth } from '@/domain/comments/value-objects/comment-depth.vo';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { CommentTargetType } from '@/domain/comments/value-objects/comment-target-type.vo';
import { TargetId } from '@/domain/comments/value-objects/target-id.vo';
import { UserId } from '@/domain/comments/value-objects/user-id.vo';
import {
  Comment,
  CommentDocument,
} from '@/infrastructure/database/schemas/comment.schema';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { CommentMapper } from './comment.mapper';
import { LikeDocument } from '../../schemas/like.schema';

import { BaseMongoRepository } from '@/shared/infrastructure/base-mongo.repository';

@Injectable()
export class CommentRepository
  extends BaseMongoRepository<CommentEntity, CommentDocument, CommentId>
  implements ICommentRepository
{
  private readonly logger = new Logger(CommentRepository.name);

  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel('Like') private readonly likeModel: Model<LikeDocument>,
  ) {
    super(commentModel);
  }

  protected toDomain(doc: CommentDocument): CommentEntity {
    return this.mapToEntity(doc);
  }

  protected toPersistence(entity: CommentEntity): any {
    return this.mapToDocument(entity);
  }

  async findById(id: CommentId): Promise<CommentEntity | null> {
    const document = await this.commentModel
      .findById(id.toString())
      .lean()
      .exec();
    return document ? this.mapToEntity(document) : null;
  }

  async findByTarget(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: CommentId | null,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = {
      targetId: new Types.ObjectId(targetId.toString()),
      targetType: targetType.toString(),
      isDeleted: false,
    };

    if (parentId) {
      queryFilter.parentId = new Types.ObjectId(parentId.toString());
    } else {
      queryFilter.parentId = null;
    }

    return this.executePaginatedQuery(
      queryFilter,
      pagination,
      sort,
      this.mapToReadModel,
      ['userId'],
    );
  }

  async findByUser(
    userId: UserId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = {
      userId: new Types.ObjectId(userId.toString()),
      isDeleted: false,
    };

    return this.executePaginatedQuery(
      queryFilter,
      pagination,
      sort,
      this.mapToReadModel,
      ['userId'],
    );
  }

  async findByParent(
    parentId: CommentId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = {
      parentId: new Types.ObjectId(parentId.toString()),
      isDeleted: false,
    };

    return this.executePaginatedQuery(
      queryFilter,
      pagination,
      sort,
      this.mapToReadModel,
      ['userId'],
    );
  }

  async findTopLevel(
    targetId: TargetId,
    targetType: CommentTargetType,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = {
      targetId: new Types.ObjectId(targetId.toString()),
      targetType: targetType.toString(),
      parentId: null,
      isDeleted: false,
    };

    return this.executePaginatedQuery(
      queryFilter,
      pagination,
      sort,
      this.mapToReadModel,
      ['userId'],
    );
  }

  async save(comment: CommentEntity): Promise<void> {
    return this.baseSave(comment);
  }

  async delete(id: CommentId): Promise<void> {
    return this.baseDelete(id);
  }

  async softDelete(id: CommentId): Promise<void> {
    return this.baseSoftDelete(id);
  }

  async existsByUserAndTarget(
    userId: UserId,
    targetId: TargetId,
    targetType: CommentTargetType,
    content?: string,
  ): Promise<boolean> {
    const queryFilter: FilterQuery<CommentDocument> = {
      userId: new Types.ObjectId(userId.toString()),
      targetId: new Types.ObjectId(targetId.toString()),
      targetType: targetType.toString(),
      isDeleted: false,
    };

    if (content) {
      queryFilter.content = { $regex: content, $options: 'i' };
    }

    const count = await this.commentModel.countDocuments(queryFilter).exec();
    return count > 0;
  }

  async countByTarget(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: CommentId | null,
  ): Promise<number> {
    const queryFilter: FilterQuery<CommentDocument> = {
      targetId: new Types.ObjectId(targetId.toString()),
      targetType: targetType.toString(),
      isDeleted: false,
    };

    if (parentId) {
      queryFilter.parentId = new Types.ObjectId(parentId.toString());
    } else if (parentId === null) {
      queryFilter.parentId = null;
    }

    return await this.commentModel.countDocuments(queryFilter).exec();
  }

  async countByUser(userId: UserId): Promise<number> {
    return await this.commentModel
      .countDocuments({
        userId: new Types.ObjectId(userId.toString()),
        isDeleted: false,
      })
      .exec();
  }

  async countByModerationStatus(
    status: 'pending' | 'approved' | 'rejected',
  ): Promise<number> {
    return await this.commentModel
      .countDocuments({
        moderationStatus: status,
        isDeleted: false,
      })
      .exec();
  }

  async countFlagged(): Promise<number> {
    return await this.commentModel
      .countDocuments({
        isFlagged: true,
        isDeleted: false,
      })
      .exec();
  }

  async findFlagged(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = {
      isFlagged: true,
      isDeleted: false,
    };

    const sortOptions: SortOptions = {
      sortBy: 'createdAt',
      order: 'desc',
    };

    return this.executePaginatedQuery(
      queryFilter,
      pagination,
      sortOptions,
      this.mapToReadModel,
      ['userId'],
    );
  }

  async findPendingModeration(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = {
      moderationStatus: 'pending',
      isDeleted: false,
    };

    const sortOptions: SortOptions = {
      sortBy: 'createdAt',
      order: 'desc',
    };

    return this.executePaginatedQuery(
      queryFilter,
      pagination,
      sortOptions,
      this.mapToReadModel,
      ['userId'],
    );
  }

  async findRejected(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = {
      moderationStatus: 'rejected',
      isDeleted: false,
    };

    const sortOptions: SortOptions = {
      sortBy: 'createdAt',
      order: 'desc',
    };

    return this.executePaginatedQuery(
      queryFilter,
      pagination,
      sortOptions,
      this.mapToReadModel,
      ['userId'],
    );
  }

  async search(
    filter: CommentFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = { isDeleted: false };

    if (filter.userId) {
      queryFilter.userId = new Types.ObjectId(filter.userId);
    }

    if (filter.targetType) {
      queryFilter.targetType = filter.targetType;
    }

    if (filter.targetId) {
      queryFilter.targetId = new Types.ObjectId(filter.targetId);
    }

    if (filter.parentId) {
      queryFilter.parentId = new Types.ObjectId(filter.parentId);
    } else if (filter.parentId === null) {
      queryFilter.parentId = null;
    }

    if (filter.isFlagged !== undefined) {
      queryFilter.isFlagged = filter.isFlagged;
    }

    if (filter.moderationStatus) {
      queryFilter.moderationStatus = filter.moderationStatus;
    }

    if (filter.search) {
      queryFilter.content = { $regex: filter.search, $options: 'i' };
    }

    if (filter.dateFrom || filter.dateTo) {
      queryFilter.createdAt = {};
      if (filter.dateFrom) {
        queryFilter.createdAt.$gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        queryFilter.createdAt.$lte = new Date(filter.dateTo);
      }
    }

    const result = await this.executePaginatedQuery(
      queryFilter,
      pagination,
      sort,
      this.mapToReadModel,
      ['userId'],
    );

    return {
      ...result,
      data: await this.enrichComments(result.data, filter.viewerUserId),
    };
  }

  async getRepliesTree(
    targetId: TargetId,
    targetType: CommentTargetType,
    maxDepth?: number,
  ): Promise<CommentReplies[]> {
    // This is a complex operation that would require recursive queries
    // For now, return top-level comments
    const topLevelComments = await this.findTopLevel(targetId, targetType);

    return topLevelComments.data.map((comment) => ({
      comment,
      replies: [], // Would need to fetch replies recursively
      totalReplies: 0,
    }));
  }

  async updateLikesCount(id: CommentId, increment: boolean): Promise<void> {
    const update = increment
      ? { $inc: { likesCount: 1 }, updatedAt: new Date() }
      : { $inc: { likesCount: -1 }, updatedAt: new Date() };

    await this.commentModel.findByIdAndUpdate(id.toString(), update).exec();
  }

  async updateModerationStatus(
    id: CommentId,
    status: 'pending' | 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    const update: any = {
      moderationStatus: status,
      updatedAt: new Date(),
    };

    if (status === 'approved') {
      update.isFlagged = false;
      update.moderationReason = '';
    } else if (status === 'rejected') {
      update.isFlagged = true;
      update.moderationReason = reason || '';
    }

    await this.commentModel.findByIdAndUpdate(id.toString(), update).exec();
  }

  async flagComment(id: CommentId, reason: string): Promise<void> {
    await this.commentModel
      .findByIdAndUpdate(id.toString(), {
        isFlagged: true,
        moderationReason: reason,
        updatedAt: new Date(),
      })
      .exec();
  }

  async unflagComment(id: CommentId): Promise<void> {
    await this.commentModel
      .findByIdAndUpdate(id.toString(), {
        isFlagged: false,
        moderationReason: '',
        updatedAt: new Date(),
      })
      .exec();
  }

  async getRecentComments(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = {
      moderationStatus: 'approved',
      isDeleted: false,
    };

    const sortOptions: SortOptions = {
      sortBy: 'createdAt',
      order: 'desc',
    };

    return this.executePaginatedQuery(
      queryFilter,
      pagination,
      sortOptions,
      this.mapToReadModel,
      ['userId'],
    );
  }

  async getPopularComments(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = {
      moderationStatus: 'approved',
      isDeleted: false,
    };

    const sortOptions: SortOptions = {
      sortBy: 'likesCount',
      order: 'desc',
    };

    return this.executePaginatedQuery(
      queryFilter,
      pagination,
      sortOptions,
      this.mapToReadModel,
      ['userId'],
    );
  }

  async batchDelete(ids: CommentId[]): Promise<void> {
    const objectIds = ids.map((id) => new Types.ObjectId(id.toString()));
    await this.commentModel
      .deleteMany({
        _id: { $in: objectIds },
      })
      .exec();
  }

  async batchModerate(
    ids: CommentId[],
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    const objectIds = ids.map((id) => new Types.ObjectId(id.toString()));
    const update: any = {
      moderationStatus: status,
      updatedAt: new Date(),
    };

    if (status === 'approved') {
      update.isFlagged = false;
      update.moderationReason = '';
    } else if (status === 'rejected') {
      update.isFlagged = true;
      update.moderationReason = reason || '';
    }

    await this.commentModel
      .updateMany({ _id: { $in: objectIds } }, update)
      .exec();
  }

  private mapToReadModel = (doc: any): CommentModel => ({
    id: doc._id.toString(),
    content: doc.content,
    targetId: doc.targetId.toString(),
    targetType: doc.targetType,
    parentId: doc.parentId ? doc.parentId.toString() : null,
    likesCount: doc.likesCount,
    repliesCount: doc.repliesCount ?? 0,
    isLiked: doc.isLiked ?? false,
    isFlagged: doc.isFlagged,
    moderationStatus: doc.moderationStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    user: {
      id: doc.userId._id.toString(),
      username: doc.userId.username,
      image: doc.userId.image,
    },
  });

  private async enrichComments(
    comments: CommentModel[],
    viewerUserId?: string,
  ): Promise<CommentModel[]> {
    if (!comments.length) {
      return comments;
    }

    const commentIds = comments.map(
      (comment) => new Types.ObjectId(comment.id),
    );
    const [replyCounts, likedDocs] = await Promise.all([
      this.commentModel
        .aggregate([
          {
            $match: {
              parentId: { $in: commentIds },
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: '$parentId',
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
      viewerUserId
        ? this.likeModel
            .find({
              userId: new Types.ObjectId(viewerUserId),
              targetType: 'comment',
              targetId: { $in: commentIds },
              status: true,
            })
            .select('targetId')
            .lean()
            .exec()
        : Promise.resolve([] as Array<{ targetId: Types.ObjectId }>),
    ]);

    const replyCountMap = new Map(
      replyCounts.map((item) => [item._id.toString(), item.count as number]),
    );
    const likedCommentIds = new Set(
      likedDocs.map((item) => item.targetId.toString()),
    );

    return comments.map((comment) => ({
      ...comment,
      repliesCount: replyCountMap.get(comment.id) ?? 0,
      isLiked: viewerUserId ? likedCommentIds.has(comment.id) : false,
    }));
  }

  private mapToEntity(document: any): CommentEntity {
    return CommentMapper.toDomain(document);
  }

  private mapToDocument(comment: CommentEntity): Partial<CommentDocument> {
    return CommentMapper.toPersistence(comment);
  }

  async resolveParentId(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: string | null,
  ): Promise<ParentResolutionResult> {
    if (!parentId) {
      return {
        effectiveParentId: null,
        level: CommentDepth.create(1),
      };
    }

    const target = (await this.commentModel
      .findById(parentId)
      .select('_id targetId targetType parentId')
      .lean()) as any;

    if (!target) {
      throw new NotFoundException('Parent comment not found');
    }

    if (target.targetId.toString() !== targetId.toString()) {
      throw new ForbiddenException(
        'Parent comment does not belong to this target',
      );
    }

    if (target.targetType !== targetType.toString()) {
      throw new ForbiddenException('Parent comment target type mismatch');
    }

    if (!target.parentId) {
      return {
        effectiveParentId: target._id.toString(),
        level: CommentDepth.create(2),
      };
    }

    const parent = (await this.commentModel
      .findById(target.parentId)
      .select('_id parentId')
      .lean()) as any;
    if (!parent) {
      throw new NotFoundException('Parent comment not found');
    }

    if (!parent.parentId) {
      return {
        effectiveParentId: target._id.toString(),
        level: CommentDepth.maxAllowed(),
      };
    }

    return {
      effectiveParentId: parent._id.toString(),
      level: CommentDepth.maxAllowed(),
    };
  }

  async countTotal(): Promise<number> {
    return await this.commentModel.countDocuments({ isDeleted: false }).exec();
  }
}
