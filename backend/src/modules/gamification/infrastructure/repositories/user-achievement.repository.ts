import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { UserAchievement, UserAchievementDocument } from '../schemas/user-achievement.schema';
import { IUserAchievementRepository, UserAchievementFilter, PaginationOptions } from '../../domain/repositories/user-achievement.repository.interface';
import { UserAchievement as UserAchievementEntity, UserAchievementId } from '../../domain/entities/user-achievement.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { AchievementId } from '../../domain/value-objects/achievement-id.vo';
import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';

@Injectable()
export class UserAchievementRepository implements IUserAchievementRepository {
    constructor(@InjectModel(UserAchievement.name) private readonly userAchievementModel: Model<UserAchievementDocument>) {}

    async findById(id: UserAchievementId): Promise<UserAchievementEntity | null> {
        const document = await this.userAchievementModel.findById(id.toString()).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findByUser(userId: UserId, pagination: PaginationOptions): Promise<PaginatedResult<UserAchievementEntity>> {
        const queryFilter: FilterQuery<UserAchievementDocument> = {
            userId: new Types.ObjectId(userId.toString())
        };

        const page = pagination.page || 1;
        const limit = pagination.limit || 10;
        const skip = (page - 1) * limit;

        let query = this.userAchievementModel.find(queryFilter);
        query = query.sort({ updatedAt: -1 }).skip(skip).limit(limit);

        const [documents, total] = await Promise.all([
            query.lean().exec(),
            this.userAchievementModel.countDocuments(queryFilter).exec()
        ]);

        return {
            data: documents.map(doc => this.mapToEntity(doc)),
            meta: {
                current: page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findByUserAndAchievement(userId: UserId, achievementId: AchievementId): Promise<UserAchievementEntity | null> {
        const document = await this.userAchievementModel.findOne({
            userId: new Types.ObjectId(userId.toString()),
            achievementId: new Types.ObjectId(achievementId.toString())
        }).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findAll(filter: UserAchievementFilter, pagination: PaginationOptions): Promise<PaginatedResult<UserAchievementEntity>> {
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
            this.userAchievementModel.countDocuments(queryFilter).exec()
        ]);

        return {
            data: documents.map(doc => this.mapToEntity(doc)),
            meta: {
                current: page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async save(userAchievement: UserAchievementEntity): Promise<void> {
        const document = this.mapToDocument(userAchievement);
        await this.userAchievementModel.findByIdAndUpdate(
            userAchievement.id.toString(),
            document,
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: UserAchievementId): Promise<void> {
        await this.userAchievementModel.findByIdAndDelete(id.toString()).exec();
    }

    async findUnlockedByUser(userId: UserId): Promise<UserAchievementEntity[]> {
        const documents = await this.userAchievementModel.find({
            userId: new Types.ObjectId(userId.toString()),
            isUnlocked: true
        }).lean().exec();
        return documents.map(doc => this.mapToEntity(doc));
    }

    async findInProgressByUser(userId: UserId): Promise<UserAchievementEntity[]> {
        const documents = await this.userAchievementModel.find({
            userId: new Types.ObjectId(userId.toString()),
            isUnlocked: false,
            progress: { $gt: 0 }
        }).lean().exec();
        return documents.map(doc => this.mapToEntity(doc));
    }

    async findNearCompletionByUser(userId: UserId, threshold: number): Promise<UserAchievementEntity[]> {
        // Find achievements where progress is close to completion
        // This would need to know the target value, so we'll return in-progress ones
        return this.findInProgressByUser(userId);
    }

    async countUnlockedByUser(userId: UserId): Promise<number> {
        return await this.userAchievementModel.countDocuments({
            userId: new Types.ObjectId(userId.toString()),
            isUnlocked: true
        }).exec();
    }

    async countTotalUnlocked(): Promise<number> {
        return await this.userAchievementModel.countDocuments({ isUnlocked: true }).exec();
    }

    async getRecentUnlocks(limit: number): Promise<UserAchievementEntity[]> {
        const documents = await this.userAchievementModel.find({ isUnlocked: true })
            .sort({ unlockedAt: -1 })
            .limit(limit)
            .lean()
            .exec();
        return documents.map(doc => this.mapToEntity(doc));
    }

    async existsByUserAndAchievement(userId: UserId, achievementId: AchievementId): Promise<boolean> {
        const count = await this.userAchievementModel.countDocuments({
            userId: new Types.ObjectId(userId.toString()),
            achievementId: new Types.ObjectId(achievementId.toString())
        }).exec();
        return count > 0;
    }

    async batchSave(userAchievements: UserAchievementEntity[]): Promise<void> {
        const operations = userAchievements.map(ua => ({
            updateOne: {
                filter: { _id: new Types.ObjectId(ua.id.toString()) },
                update: { $set: this.mapToDocument(ua) },
                upsert: true
            }
        }));

        await this.userAchievementModel.bulkWrite(operations);
    }

    private mapToEntity(document: any): UserAchievementEntity {
        return UserAchievementEntity.reconstitute({
            id: document._id.toString(),
            userId: document.userId?.toString() || '',
            achievementId: document.achievementId?.toString() || '',
            progress: document.progress || 0,
            isUnlocked: document.isUnlocked || false,
            unlockedAt: document.unlockedAt || null,
            rewardXP: document.rewardXP || 0,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt
        });
    }

    private mapToDocument(userAchievement: UserAchievementEntity): Partial<UserAchievementDocument> {
        return {
            userId: new Types.ObjectId(userAchievement.userId.toString()),
            achievementId: new Types.ObjectId(userAchievement.achievementId.toString()),
            progress: userAchievement.progress,
            isUnlocked: userAchievement.isUnlocked,
            unlockedAt: userAchievement.unlockedAt || undefined,
            rewardXP: userAchievement.rewardXP.getValue(),
            updatedAt: userAchievement.updatedAt
        };
    }
}
