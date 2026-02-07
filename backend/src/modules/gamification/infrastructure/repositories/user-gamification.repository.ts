import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { UserGamification, UserGamificationDocument } from '../schemas/user-gamification.schema';
import { IUserGamificationRepository, UserGamificationFilter, PaginationOptions } from '../../domain/repositories/user-gamification.repository.interface';
import { UserGamification as UserGamificationEntity } from '../../domain/entities/user-gamification.entity';
import { UserGamificationId } from '../../domain/value-objects/user-gamification-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';

@Injectable()
export class UserGamificationRepository implements IUserGamificationRepository {
    constructor(@InjectModel(UserGamification.name) private readonly userGamificationModel: Model<UserGamificationDocument>) {}

    async findById(id: UserGamificationId): Promise<UserGamificationEntity | null> {
        const document = await this.userGamificationModel.findById(id.toString()).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findByUser(userId: UserId): Promise<UserGamificationEntity | null> {
        const document = await this.userGamificationModel.findOne({
            userId: new Types.ObjectId(userId.toString())
        }).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findAll(filter: UserGamificationFilter, pagination: PaginationOptions): Promise<PaginatedResult<UserGamificationEntity>> {
        const queryFilter: FilterQuery<UserGamificationDocument> = {};

        if (filter.minStreak !== undefined) {
            queryFilter.currentStreak = { $gte: filter.minStreak };
        }

        if (filter.maxStreak !== undefined) {
            queryFilter.currentStreak = { ...queryFilter.currentStreak, $lte: filter.maxStreak };
        }

        const page = pagination.page || 1;
        const limit = pagination.limit || 10;
        const skip = (page - 1) * limit;

        let query = this.userGamificationModel.find(queryFilter);
        query = query.sort({ currentStreak: -1 }).skip(skip).limit(limit);

        const [documents, total] = await Promise.all([
            query.lean().exec(),
            this.userGamificationModel.countDocuments(queryFilter).exec()
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

    async save(gamification: UserGamificationEntity): Promise<void> {
        const document = this.mapToDocument(gamification);
        await this.userGamificationModel.findByIdAndUpdate(
            gamification.id.toString(),
            document,
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: UserGamificationId): Promise<void> {
        await this.userGamificationModel.findByIdAndDelete(id.toString()).exec();
    }

    async getTopUsersByStreak(limit: number): Promise<UserGamificationEntity[]> {
        const documents = await this.userGamificationModel.find()
            .sort({ currentStreak: -1 })
            .limit(limit)
            .lean()
            .exec();
        return documents.map(doc => this.mapToEntity(doc));
    }

    async getTopUsersByXP(limit: number): Promise<UserGamificationEntity[]> {
        // Assuming we store totalXP, otherwise we'd need to calculate from achievements
        const documents = await this.userGamificationModel.find()
            .sort({ currentStreak: -1 }) // Fallback to streak if XP not stored directly
            .limit(limit)
            .lean()
            .exec();
        return documents.map(doc => this.mapToEntity(doc));
    }

    async getActiveStreaksCount(): Promise<number> {
        return await this.userGamificationModel.countDocuments({
            currentStreak: { $gt: 0 }
        }).exec();
    }

    async getTotalXPDistributed(): Promise<number> {
        // This would require aggregation or separate tracking
        // For now, return 0 as placeholder
        return 0;
    }

    async existsByUser(userId: UserId): Promise<boolean> {
        const count = await this.userGamificationModel.countDocuments({
            userId: new Types.ObjectId(userId.toString())
        }).exec();
        return count > 0;
    }

    async countActiveStreaks(): Promise<number> {
        return await this.userGamificationModel.countDocuments({
            currentStreak: { $gt: 0 }
        }).exec();
    }

    async countUsersWithStreak(): Promise<number> {
        return await this.userGamificationModel.countDocuments({
            longestStreak: { $gt: 0 }
        }).exec();
    }

    private mapToEntity(document: any): UserGamificationEntity {
        return UserGamificationEntity.reconstitute({
            id: document._id.toString(),
            userId: document.userId?.toString() || '',
            currentStreak: document.currentStreak || 0,
            longestStreak: document.longestStreak || 0,
            lastReadDate: document.lastReadDate || null,
            streakFreezeCount: document.streakFreezeCount || 2,
            totalXP: document.totalXP || 0,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt
        });
    }

    private mapToDocument(gamification: UserGamificationEntity): Partial<UserGamificationDocument> {
        return {
            userId: new Types.ObjectId(gamification.userId.toString()),
            currentStreak: gamification.streak.getCurrent(),
            longestStreak: gamification.streak.getLongest(),
            lastReadDate: gamification.lastReadDate ?? undefined,
            streakFreezeCount: gamification.streakFreezeCount,
            totalXP: gamification.totalXP.getValue(),
            updatedAt: gamification.updatedAt
        };
    }
}
