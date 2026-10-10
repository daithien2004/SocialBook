import {
  buildPaginationMeta,
  PaginatedResult,
  PaginationMeta,
  PaginationOptions,
  SortOptions,
} from '@/shared/domain/pagination.types';

import { FollowWithUserInfo } from './follow.mapper';
import { Follow as FollowEntity } from '@/modules/follows/domain/entities/follow.entity';
import {
  FollowFilter,
  FollowStatusResult,
  IFollowRepository,
} from '@/modules/follows/domain/repositories/follow.repository.interface';
import { TargetId } from '@/modules/follows/domain/value-objects/target-id.vo';
import { UserId } from '@/modules/follows/domain/value-objects/user-id.vo';
import {
  Follow,
  FollowDocument,
} from '@/modules/follows/infrastructure/schemas/follow.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { FollowMapper } from './follow.mapper';

interface AggregationFollowRow {
  _id: Types.ObjectId;
  id?: string;
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
  status: boolean;
  username?: string;
  image?: string;
  postCount: number;
  readingListCount: number;
  followersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FollowRepository implements IFollowRepository {
  constructor(
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
  ) {}

  async findByUser(
    userId: UserId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    const queryFilter: FilterQuery<FollowDocument> = {
      userId: new Types.ObjectId(userId.toString()),
      status: true,
    };

    return this.paginate(queryFilter, pagination, sort);
  }

  async findByUserWithUserInfo(
    userId: string,
    page = 1,
    limit = 100,
  ): Promise<{ data: FollowWithUserInfo[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;

    const rows = await this.followModel
      .aggregate<AggregationFollowRow>([
        { $match: { userId: new Types.ObjectId(userId), status: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'targetId',
            foreignField: '_id',
            as: 'targetUser',
          },
        },
        {
          $unwind: { path: '$targetUser', preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: 'posts',
            localField: 'targetId',
            foreignField: 'userId',
            pipeline: [{ $match: { isDeleted: false } }],
            as: 'posts',
          },
        },
        {
          $lookup: {
            from: 'reading_lists',
            localField: 'targetId',
            foreignField: 'userId',
            as: 'readingLists',
          },
        },
        {
          $lookup: {
            from: 'follows',
            localField: 'targetId',
            foreignField: 'targetId',
            pipeline: [{ $match: { status: true } }],
            as: 'followers',
          },
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            id: '$_id',
            userId: 1,
            targetId: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            username: '$targetUser.username',
            image: '$targetUser.image',
            postCount: { $size: '$posts' },
            readingListCount: { $size: '$readingLists' },
            followersCount: { $size: '$followers' },
          },
        },
      ])
      .exec();
    const total = await this.followModel.countDocuments({
      userId: new Types.ObjectId(userId),
      status: true,
    });
    return {
      data: rows.map((r: AggregationFollowRow) => ({
        id: r._id?.toString() ?? r.id?.toString(),
        userId: r.userId?.toString(),
        targetId: r.targetId?.toString(),
        status: r.status,
        username: r.username,
        image: r.image,
        postCount: r.postCount || 0,
        readingListCount: r.readingListCount || 0,
        followersCount: r.followersCount || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      meta: {
        current: page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByTargetWithUserInfo(
    targetId: string,
    page = 1,
    limit = 100,
  ): Promise<{ data: FollowWithUserInfo[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;

    const rows = await this.followModel
      .aggregate<AggregationFollowRow>([
        { $match: { targetId: new Types.ObjectId(targetId), status: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'followerUser',
          },
        },
        {
          $unwind: {
            path: '$followerUser',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'posts',
            localField: 'userId',
            foreignField: 'userId',
            pipeline: [{ $match: { isDeleted: false } }],
            as: 'posts',
          },
        },
        {
          $lookup: {
            from: 'reading_lists',
            localField: 'userId',
            foreignField: 'userId',
            as: 'readingLists',
          },
        },
        {
          $lookup: {
            from: 'follows',
            localField: 'userId',
            foreignField: 'targetId',
            pipeline: [{ $match: { status: true } }],
            as: 'followers',
          },
        },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            id: '$_id',
            userId: 1,
            targetId: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            username: '$followerUser.username',
            image: '$followerUser.image',
            postCount: { $size: '$posts' },
            readingListCount: { $size: '$readingLists' },
            followersCount: { $size: '$followers' },
          },
        },
      ])
      .exec();
    const total = await this.followModel.countDocuments({
      targetId: new Types.ObjectId(targetId),
      status: true,
    });

    return {
      data: rows.map((r: AggregationFollowRow) => ({
        id: r._id?.toString() ?? r.id?.toString(),
        userId: r.userId?.toString(),
        targetId: r.targetId?.toString(),
        status: r.status,
        username: r.username,
        image: r.image,
        postCount: r.postCount || 0,
        readingListCount: r.readingListCount || 0,
        followersCount: r.followersCount || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      meta: {
        current: page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByTarget(
    targetId: TargetId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    const queryFilter: FilterQuery<FollowDocument> = {
      targetId: new Types.ObjectId(targetId.toString()),
      status: true,
    };

    return this.paginate(queryFilter, pagination, sort);
  }

  async findAll(
    filter: FollowFilter,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    const queryFilter: FilterQuery<FollowDocument> = {};

    if (filter.userId) {
      queryFilter.userId = new Types.ObjectId(filter.userId);
    }

    if (filter.targetId) {
      queryFilter.targetId = new Types.ObjectId(filter.targetId);
    }

    if (filter.status !== undefined) {
      queryFilter.status = filter.status;
    }

    if (filter.dateFrom || filter.dateTo) {
      queryFilter.createdAt = {};
      if (filter.dateFrom) {
        (queryFilter.createdAt as Record<string, Date>)['$gte'] =
          filter.dateFrom;
      }
      if (filter.dateTo) {
        (queryFilter.createdAt as Record<string, Date>)['$lte'] = filter.dateTo;
      }
    }

    return this.paginate(queryFilter, pagination, sort);
  }

  async save(follow: FollowEntity): Promise<void> {
    const id = new Types.ObjectId(follow.id.toString());
    await this.followModel
      .findByIdAndUpdate(
        id,
        {
          $set: FollowMapper.toPersistence(follow),
          $setOnInsert: { _id: id },
        },
        { upsert: true },
      )
      .exec();
  }

  protected toDomain(doc: FollowDocument): FollowEntity {
    return FollowMapper.toDomain(doc);
  }

  protected toPersistence(
    entity: FollowEntity,
  ): ReturnType<typeof FollowMapper.toPersistence> {
    return FollowMapper.toPersistence(entity);
  }

  private async paginate(
    filter: FilterQuery<FollowDocument>,
    pagination: PaginationOptions = { page: 1, limit: 10 },
    sort?: SortOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    const skip = (pagination.page - 1) * pagination.limit;
    const sortField = sort?.sortBy ?? 'createdAt';
    const sortDirection = sort?.order === 'asc' ? 1 : -1;
    const [documents, total] = await Promise.all([
      this.followModel
        .find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      this.followModel.countDocuments(filter).exec(),
    ]);

    return {
      data: documents.map((document) => FollowMapper.toDomain(document)),
      meta: buildPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async exists(
    userId: UserId,
    targetId: TargetId,
  ): Promise<FollowEntity | null> {
    const document = await this.followModel
      .findOne({
        userId: new Types.ObjectId(userId.toString()),
        targetId: new Types.ObjectId(targetId.toString()),
      })
      .lean()
      .exec();

    return document ? this.toDomain(document) : null;
  }

  async getFollowStatus(
    userId: UserId,
    targetId: TargetId,
  ): Promise<FollowStatusResult> {
    const follow = await this.followModel
      .findOne({
        userId: new Types.ObjectId(userId.toString()),
        targetId: new Types.ObjectId(targetId.toString()),
      })
      .lean()
      .exec();

    return {
      userId: userId.toString(),
      targetId: targetId.toString(),
      isFollowing: follow ? follow.status : false,
      isOwner: userId.getValue() === targetId.getValue(),
      followId: follow ? follow._id.toString() : undefined,
    };
  }

  async countFollowers(targetId: TargetId): Promise<number> {
    return await this.followModel
      .countDocuments({
        targetId: new Types.ObjectId(targetId.toString()),
        status: true,
      })
      .exec();
  }
}
