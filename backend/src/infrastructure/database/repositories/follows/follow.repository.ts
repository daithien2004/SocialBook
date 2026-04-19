import {
  PaginatedResult,
  PaginationOptions,
  SortOptions,
} from '@/common/interfaces/pagination.interface';
import { Follow as FollowEntity } from '@/domain/follows/entities/follow.entity';
import {
  FollowFilter,
  FollowStats,
  FollowStatusResult,
  IFollowRepository,
} from '@/domain/follows/repositories/follow.repository.interface';
import { FollowId } from '@/domain/follows/value-objects/follow-id.vo';
import { TargetId } from '@/domain/follows/value-objects/target-id.vo';
import { UserId } from '@/domain/follows/value-objects/user-id.vo';
import {
  Follow,
  FollowDocument,
} from '@/infrastructure/database/schemas/follow.schema';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { FollowMapper } from './follow.mapper';

import { BaseMongoRepository } from '@/shared/infrastructure/base-mongo.repository';

@Injectable()
export class FollowRepository
  extends BaseMongoRepository<FollowEntity, FollowDocument, FollowId>
  implements IFollowRepository
{
  constructor(
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    private readonly idGenerator: IIdGenerator,
  ) {
    super(followModel);
  }

  async findById(id: FollowId): Promise<FollowEntity | null> {
    const document = await this.followModel
      .findById(id.toString())
      .lean()
      .exec();
    return document ? this.toDomain(document) : null;
  }

  async findByUser(
    userId: UserId,
    pagination?: PaginationOptions,
    sort?: SortOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    const queryFilter: FilterQuery<FollowDocument> = {
      userId: new Types.ObjectId(userId.toString()),
      status: true,
    };

    return this.executePaginatedQuery(queryFilter, pagination, sort);
  }

  async findByUserWithUserInfo(
    userId: string,
    page = 1,
    limit = 100,
  ): Promise<{ data: any[]; meta: any }> {
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.followModel
        .aggregate([
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
            },
          },
        ])
        .exec(),
      this.followModel.countDocuments({
        userId: new Types.ObjectId(userId),
        status: true,
      }),
    ]);
    return {
      data: rows.map((r) => ({
        id: r._id?.toString() ?? r.id?.toString(),
        userId: r.userId?.toString(),
        targetId: r.targetId?.toString(),
        status: r.status,
        username: r.username,
        image: r.image,
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
  ): Promise<{ data: any[]; meta: any }> {
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.followModel
        .aggregate([
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
            },
          },
        ])
        .exec(),
      this.followModel.countDocuments({
        targetId: new Types.ObjectId(targetId),
        status: true,
      }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r._id?.toString() ?? r.id?.toString(),
        userId: r.userId?.toString(),
        targetId: r.targetId?.toString(),
        status: r.status,
        username: r.username,
        image: r.image,
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

    return this.executePaginatedQuery(queryFilter, pagination, sort);
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
        queryFilter.createdAt.$gte = filter.dateFrom;
      }
      if (filter.dateTo) {
        queryFilter.createdAt.$lte = filter.dateTo;
      }
    }

    return this.executePaginatedQuery(queryFilter, pagination, sort);
  }

  async save(follow: FollowEntity): Promise<void> {
    return this.baseSave(follow);
  }

  async delete(id: FollowId): Promise<void> {
    return this.baseDelete(id);
  }

  async softDelete(id: FollowId): Promise<void> {
    await this.followModel
      .findByIdAndUpdate(id.toString(), {
        status: false,
        updatedAt: new Date(),
      })
      .exec();
  }

  protected toDomain(doc: FollowDocument): FollowEntity {
    return FollowMapper.toDomain(doc);
  }

  protected toPersistence(entity: FollowEntity): any {
    return FollowMapper.toPersistence(entity);
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

  async countFollowing(userId: UserId): Promise<number> {
    return await this.followModel
      .countDocuments({
        userId: new Types.ObjectId(userId.toString()),
        status: true,
      })
      .exec();
  }

  async countFollowers(targetId: TargetId): Promise<number> {
    return await this.followModel
      .countDocuments({
        targetId: new Types.ObjectId(targetId.toString()),
        status: true,
      })
      .exec();
  }

  async countActiveFollows(): Promise<number> {
    return await this.followModel.countDocuments({ status: true }).exec();
  }

  async countInactiveFollows(): Promise<number> {
    return await this.followModel.countDocuments({ status: false }).exec();
  }

  async getFollowingIds(userId: UserId): Promise<string[]> {
    const documents = await this.followModel
      .find({
        userId: new Types.ObjectId(userId.toString()),
        status: true,
      })
      .select('targetId')
      .lean()
      .exec();

    return documents.map((doc) => doc.targetId.toString());
  }

  async getFollowerIds(targetId: TargetId): Promise<string[]> {
    const documents = await this.followModel
      .find({
        targetId: new Types.ObjectId(targetId.toString()),
        status: true,
      })
      .select('userId')
      .lean()
      .exec();

    return documents.map((doc) => doc.userId.toString());
  }

  async findMutualFollows(
    userId1: UserId,
    userId2: UserId,
  ): Promise<FollowEntity[]> {
    // Find users that both userId1 and userId2 are following
    const following1 = await this.getFollowingIds(userId1);
    const following2 = await this.getFollowingIds(userId2);

    const mutualIds = following1.filter((id) => following2.includes(id));

    if (mutualIds.length === 0) return [];

    const documents = await this.followModel
      .find({
        userId: new Types.ObjectId(userId1.toString()),
        targetId: { $in: mutualIds.map((id) => new Types.ObjectId(id)) },
        status: true,
      })
      .lean()
      .exec();

    return documents.map((doc) => this.toDomain(doc));
  }

  async getFollowStats(userId: UserId): Promise<FollowStats> {
    const [totalFollowing, totalFollowers, recentFollows] = await Promise.all([
      this.countFollowing(userId),
      this.countFollowers(TargetId.create(userId.toString())),
      this.getRecentFollows({ page: 1, limit: 5 }),
    ]);

    return {
      totalFollowing,
      totalFollowers,
      followingCount: totalFollowing,
      followersCount: totalFollowers,
      recentFollows: recentFollows.data,
    };
  }

  async batchDelete(ids: FollowId[]): Promise<void> {
    const objectIds = ids.map((id) => new Types.ObjectId(id.toString()));
    await this.followModel.deleteMany({ _id: { $in: objectIds } }).exec();
  }

  async batchUpdateStatus(ids: FollowId[], status: boolean): Promise<void> {
    const objectIds = ids.map((id) => new Types.ObjectId(id.toString()));
    await this.followModel
      .updateMany(
        { _id: { $in: objectIds } },
        { status, updatedAt: new Date() },
      )
      .exec();
  }

  async getRecentFollows(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    const queryFilter: FilterQuery<FollowDocument> = { status: true };
    const sortOptions: SortOptions = { sortBy: 'createdAt', order: 'desc' };

    return this.executePaginatedQuery(queryFilter, pagination, sortOptions);
  }

  async getPopularFollows(
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<FollowEntity>> {
    // For follows, "popular" could mean most followed targets
    // This would require aggregation, but for now we'll just return recent follows
    return this.getRecentFollows(pagination);
  }

  async followUser(userId: UserId, targetId: TargetId): Promise<FollowEntity> {
    const existingFollow = await this.exists(userId, targetId);

    if (existingFollow) {
      existingFollow.activate();
      await this.save(existingFollow);
      return existingFollow;
    }

    const follow = FollowEntity.create({
      id: FollowId.create(this.idGenerator.generate()),
      userId: userId.toString(),
      targetId: targetId.toString(),
      status: true,
    });

    await this.save(follow);
    return follow;
  }

  async unfollowUser(
    userId: UserId,
    targetId: TargetId,
  ): Promise<FollowEntity> {
    const existingFollow = await this.exists(userId, targetId);

    if (existingFollow) {
      existingFollow.deactivate();
      await this.save(existingFollow);
      return existingFollow;
    }

    const follow = FollowEntity.create({
      id: FollowId.create(this.idGenerator.generate()),
      userId: userId.toString(),
      targetId: targetId.toString(),
      status: false,
    });

    await this.save(follow);
    return follow;
  }

  async toggleFollow(
    userId: UserId,
    targetId: TargetId,
  ): Promise<FollowEntity> {
    const existingFollow = await this.exists(userId, targetId);

    if (existingFollow) {
      existingFollow.toggleStatus();
      await this.save(existingFollow);
      return existingFollow;
    }

    return this.followUser(userId, targetId);
  }
}
