import {
  PaginatedResult,
  PaginationOptions,
} from '@/common/interfaces/pagination.interface';
import {
  UserAchievement as UserAchievementEntity,
  UserAchievementId,
} from '@/domain/gamification/entities/user-achievement.entity';
import {
  IUserAchievementRepository,
  UserAchievementFilter,
} from '@/domain/gamification/repositories/user-achievement.repository.interface';
import { AchievementId } from '@/domain/gamification/value-objects/achievement-id.vo';
import { UserId } from '@/domain/gamification/value-objects/user-id.vo';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  UserAchievement,
  UserAchievementDocument,
} from '../../schemas/user-achievement.schema';
import { UserAchievementMapper } from './user-achievement.mapper';

import { BaseMongoRepository } from '@/shared/infrastructure/base-mongo.repository';

@Injectable()
export class UserAchievementRepository
  extends BaseMongoRepository<
    UserAchievementEntity,
    UserAchievementDocument,
    UserAchievementId
  >
  implements IUserAchievementRepository
{
  constructor(
    @InjectModel(UserAchievement.name)
    private readonly userAchievementModel: Model<UserAchievementDocument>,
  ) {
    super(userAchievementModel);
  }

  protected toDomain(doc: UserAchievementDocument): UserAchievementEntity {
    return this.mapToEntity(doc);
  }

  protected toPersistence(entity: UserAchievementEntity): any {
    return this.mapToDocument(entity);
  }

  async findById(id: UserAchievementId): Promise<UserAchievementEntity | null> {
    const document = await this.userAchievementModel
      .findById(id.toString())
      .lean()
      .exec();
    return document ? this.mapToEntity(document) : null;
  }

  async findByUser(
    userId: UserId,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<UserAchievementEntity>> {
    const queryFilter: FilterQuery<UserAchievementDocument> = {
      userId: new Types.ObjectId(userId.toString()),
    };

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    let query = this.userAchievementModel.find(queryFilter);
    query = query.sort({ updatedAt: -1 }).skip(skip).limit(limit);

    const [documents, total] = await Promise.all([
      query.lean().exec(),
      this.userAchievementModel.countDocuments(queryFilter).exec(),
    ]);

    return {
      data: documents.map((doc) => this.mapToEntity(doc)),
      meta: this.buildMeta(page, limit, total),
    };
  }

  async findByUserAndAchievement(
    userId: UserId,
    achievementId: AchievementId,
  ): Promise<UserAchievementEntity | null> {
    const document = await this.userAchievementModel
      .findOne({
        userId: new Types.ObjectId(userId.toString()),
        achievementId: new Types.ObjectId(achievementId.toString()),
      })
      .lean()
      .exec();
    return document ? this.mapToEntity(document) : null;
  }

  async findAll(
    filter: UserAchievementFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<UserAchievementEntity>> {
    const queryFilter: FilterQuery<UserAchievementDocument> = {};

    if (filter.userId) {
      queryFilter.userId = new Types.ObjectId(filter.userId);
    }

    if (filter.achievementId) {
      queryFilter.achievementId = new Types.ObjectId(filter.achievementId);
    }

    if (filter.isUnlocked !== undefined) {
      queryFilter.isUnlocked = filter.isUnlocked;
    }

    if (filter.minProgress !== undefined) {
      queryFilter.progress = { $gte: filter.minProgress };
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    let query = this.userAchievementModel.find(queryFilter);
    query = query.sort({ updatedAt: -1 }).skip(skip).limit(limit);

    const [documents, total] = await Promise.all([
      query.lean().exec(),
      this.userAchievementModel.countDocuments(queryFilter).exec(),
    ]);

    return {
      data: documents.map((doc) => this.mapToEntity(doc)),
      meta: this.buildMeta(page, limit, total),
    };
  }

  async save(userAchievement: UserAchievementEntity): Promise<void> {
    return this.baseSave(userAchievement);
  }

  async delete(id: UserAchievementId): Promise<void> {
    return this.baseDelete(id);
  }

  async findUnlockedByUser(userId: UserId): Promise<UserAchievementEntity[]> {
    const documents = await this.userAchievementModel
      .find({
        userId: new Types.ObjectId(userId.toString()),
        isUnlocked: true,
      })
      .lean()
      .exec();
    return documents.map((doc) => this.mapToEntity(doc));
  }

  async findInProgressByUser(userId: UserId): Promise<UserAchievementEntity[]> {
    const documents = await this.userAchievementModel
      .find({
        userId: new Types.ObjectId(userId.toString()),
        isUnlocked: false,
        progress: { $gt: 0 },
      })
      .lean()
      .exec();
    return documents.map((doc) => this.mapToEntity(doc));
  }

  async findNearCompletionByUser(
    userId: UserId,
    threshold: number,
  ): Promise<UserAchievementEntity[]> {
    // Find achievements where progress is close to completion
    // This would need to know the target value, so we'll return in-progress ones
    return this.findInProgressByUser(userId);
  }

  async countUnlockedByUser(userId: UserId): Promise<number> {
    return await this.userAchievementModel
      .countDocuments({
        userId: new Types.ObjectId(userId.toString()),
        isUnlocked: true,
      })
      .exec();
  }

  async countTotalUnlocked(): Promise<number> {
    return await this.userAchievementModel
      .countDocuments({ isUnlocked: true })
      .exec();
  }

  async getRecentUnlocks(limit: number): Promise<UserAchievementEntity[]> {
    const documents = await this.userAchievementModel
      .find({ isUnlocked: true })
      .sort({ unlockedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return documents.map((doc) => this.mapToEntity(doc));
  }

  async existsByUserAndAchievement(
    userId: UserId,
    achievementId: AchievementId,
  ): Promise<boolean> {
    const count = await this.userAchievementModel
      .countDocuments({
        userId: new Types.ObjectId(userId.toString()),
        achievementId: new Types.ObjectId(achievementId.toString()),
      })
      .exec();
    return count > 0;
  }

  async batchSave(userAchievements: UserAchievementEntity[]): Promise<void> {
    const operations = userAchievements.map((ua) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(ua.id.toString()) },
        update: { $set: this.mapToDocument(ua) },
        upsert: true,
      },
    }));

    await this.userAchievementModel.bulkWrite(operations);
  }

  private mapToEntity(document: any): UserAchievementEntity {
    return UserAchievementMapper.toDomain(document);
  }

  private mapToDocument(
    userAchievement: UserAchievementEntity,
  ): Partial<UserAchievementDocument> {
    return UserAchievementMapper.toPersistence(userAchievement);
  }
}
