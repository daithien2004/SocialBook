import {
  buildPaginationMeta,
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';
import { Comment as CommentEntity } from '@/modules/comments/domain/entities/comment.entity';
import { CommentModel } from '@/modules/comments/domain/read-models/comment-model';
import {
  CommentFilter,
  ICommentRepository,
  ParentResolutionResult,
} from '@/modules/comments/domain/repositories/comment.repository.interface';
import { CommentDepth } from '@/modules/comments/domain/value-objects/comment-depth.vo';
import { CommentId } from '@/modules/comments/domain/value-objects/comment-id.vo';
import { CommentTargetType } from '@/modules/comments/domain/value-objects/comment-target-type.vo';
import { TargetId } from '@/modules/comments/domain/value-objects/target-id.vo';
import {
  Comment,
  CommentDocument,
} from '@/modules/comments/infrastructure/schemas/comment.schema';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { CommentMapper, CommentReadModelRaw } from './comment.mapper';
import { LikeDocument } from '@/modules/likes/infrastructure/schemas/public-api';

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel('Like') private readonly likeModel: Model<LikeDocument>,
  ) {}

  async findById(id: CommentId): Promise<CommentEntity | null> {
    const document = await this.commentModel
      .findById(id.toString())
      .lean()
      .exec();
    return document ? this.mapToEntity(document) : null;
  }

  async save(comment: CommentEntity): Promise<void> {
    const id = new Types.ObjectId(comment.id.toString());
    await this.commentModel
      .findByIdAndUpdate(
        id,
        { $set: this.mapToDocument(comment), $setOnInsert: { _id: id } },
        { upsert: true },
      )
      .exec();
  }

  async delete(id: CommentId): Promise<void> {
    await this.commentModel.findByIdAndDelete(id.toString()).exec();
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

  async search(
    filter: CommentFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const queryFilter: FilterQuery<CommentDocument> = { isDeleted: false };

    queryFilter.targetId = new Types.ObjectId(filter.targetId);

    if (filter.parentId) {
      queryFilter.parentId = new Types.ObjectId(filter.parentId);
    } else if (filter.parentId === null) {
      queryFilter.parentId = null;
    }

    const result = await this.paginateReadModels(queryFilter, pagination, sort);

    return {
      ...result,
      data: await this.enrichComments(result.data, filter.viewerUserId),
    };
  }

  async updateModerationStatus(
    id: CommentId,
    status: 'pending' | 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    const update: Record<string, unknown> = {
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

  private mapToReadModel = (doc: CommentReadModelRaw): CommentModel => ({
    id: doc._id.toString(),
    content: doc.content,
    targetId: doc.targetId.toString(),
    targetType: doc.targetType,
    parentId: doc.parentId ? doc.parentId.toString() : null,
    likesCount: doc.likesCount,
    repliesCount: doc.repliesCount ?? 0,
    isLiked: doc.isLiked ?? false,
    isFlagged: doc.isFlagged,
    moderationStatus: doc.moderationStatus ?? 'pending',
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
        .aggregate<{ _id: Types.ObjectId; count: number }>([
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
            .lean<Array<{ targetId: Types.ObjectId }>>()
            .exec()
        : Promise.resolve([] as Array<{ targetId: Types.ObjectId }>),
    ]);

    const replyCountMap = new Map(
      replyCounts.map((item) => [item._id.toString(), item.count]),
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

  private mapToEntity(document: Comment): CommentEntity {
    return CommentMapper.toDomain(document);
  }

  private mapToDocument(comment: CommentEntity): Partial<CommentDocument> {
    return CommentMapper.toPersistence(comment);
  }

  private async paginateReadModels(
    filter: FilterQuery<CommentDocument>,
    pagination: PaginationOptions = { page: 1, limit: 10 },
    sort?: SortOptions,
  ): Promise<PaginatedResult<CommentModel>> {
    const skip = (pagination.page - 1) * pagination.limit;
    const sortField = sort?.sortBy ?? 'createdAt';
    const sortDirection = sort?.order === 'asc' ? 1 : -1;
    const [documents, total] = await Promise.all([
      this.commentModel
        .find(filter)
        .populate<{ userId: CommentReadModelRaw['userId'] }>(
          'userId',
          'username image',
        )
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      this.commentModel.countDocuments(filter).exec(),
    ]);

    return {
      data: documents.map((document) => this.mapToReadModel(document)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
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

    const target = await this.commentModel
      .findById(parentId)
      .select('_id targetId targetType parentId')
      .lean()
      .exec();

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

    const parent = await this.commentModel
      .findById(target.parentId)
      .select('_id parentId')
      .lean()
      .exec();
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
