import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { User as UserEntity } from '@/domain/users/entities/user.entity';
import { IUserRepository, UserFilter, UserPaginationOptions } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { IReadingPreferences } from '@/domain/users/value-objects/reading-preferences.vo';
import { User, UserDocument } from '../../schemas/user.schema';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { UserMapper } from './user.mapper';

interface UserPersistence {
    _id: Types.ObjectId;
    roleId: Types.ObjectId;
    username: string;
    email: string;
    password?: string;
    isVerified: boolean;
    isBanned: boolean;
    provider: string;
    providerId?: string;
    image?: string;
    bio?: string;
    location?: string;
    website?: string;
    hashedRt?: string;
    onboardingCompleted: boolean;
    readingPreferences?: IReadingPreferences;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class UsersRepository implements IUserRepository {
    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

    private toDomain(doc: UserDocument): UserEntity {
        return UserMapper.toDomain(doc);
    }

    private toPersistence(entity: UserEntity): UserPersistence {
        return UserMapper.toPersistence(entity);
    }

    async findById(id: UserId): Promise<UserEntity | null> {
        const doc = await this.userModel.findById(id.toString()).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByEmail(email: UserEmail): Promise<UserEntity | null> {
        const doc = await this.userModel.findOne({ email: email.toString() }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByUsername(username: string): Promise<UserEntity | null> {
        const doc = await this.userModel.findOne({ username }).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findAll(
        filter: UserFilter,
        pagination: UserPaginationOptions
    ): Promise<PaginatedResult<UserEntity>> {
        const query: FilterQuery<UserDocument> = {};
        
        if (filter.username) {
            query.username = { $regex: filter.username, $options: 'i' };
        }
        if (filter.email) {
            query.email = { $regex: filter.email, $options: 'i' };
        }
        if (filter.roleId) {
            query.roleId = new Types.ObjectId(filter.roleId);
        }
        if (filter.isBanned !== undefined) {
            query.isBanned = filter.isBanned;
        }
        if (filter.isVerified !== undefined) {
            query.isVerified = filter.isVerified;
        }

        const skip = (pagination.page - 1) * pagination.limit;
        
        const [docs, total] = await Promise.all([
            this.userModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            this.userModel.countDocuments(query).exec()
        ]);

        return {
            data: docs.map(doc => this.toDomain(doc)),
            meta: {
                total,
                current: pagination.page,
                pageSize: pagination.limit,
                totalPages: Math.ceil(total / pagination.limit),
            },
        };
    }

    async save(user: UserEntity): Promise<void> {
        const persistenceData = this.toPersistence(user);
        
        await this.userModel.findOneAndUpdate(
            { _id: persistenceData._id },
            { $set: persistenceData },
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: UserId): Promise<void> {
        await this.userModel.findByIdAndDelete(id.toString()).exec();
    }
    
    async existsByEmail(email: UserEmail, excludeId?: UserId): Promise<boolean> {
        const query: FilterQuery<UserDocument> = { email: email.toString() };
        if (excludeId) {
            query._id = { $ne: new Types.ObjectId(excludeId.toString()) };
        }
        const result = await this.userModel.exists(query);
        return !!result;
    }

    async existsByUsername(username: string, excludeId?: UserId): Promise<boolean> {
        const query: FilterQuery<UserDocument> = { username };
        if (excludeId) {
            query._id = { $ne: new Types.ObjectId(excludeId.toString()) };
        }
        const result = await this.userModel.exists(query);
        return !!result;
    }

    async existsById(id: UserId): Promise<boolean> {
        const result = await this.userModel.exists({ _id: id.toString() });
        return !!result;
    }

    async findByIds(ids: UserId[]): Promise<UserEntity[]> {
        const docs = await this.userModel.find({
            _id: { $in: ids.map(id => id.toString()) }
        }).exec();
        return docs.map(doc => this.toDomain(doc));
    }

    async updateOnboardingData(id: UserId, data: { onboardingId?: string; gamificationId?: string; onboardingCompleted?: boolean }): Promise<void> {
        const update: any = {};
        if (data.onboardingId) update.onboardingId = new Types.ObjectId(data.onboardingId);
        if (data.gamificationId) update.gamificationId = new Types.ObjectId(data.gamificationId);
        if (data.onboardingCompleted !== undefined) update.onboardingCompleted = data.onboardingCompleted;

        await this.userModel.findByIdAndUpdate(id.toString(), { $set: update }).exec();
    }

    // Statistics
    async countByDate(startDate: Date, endDate?: Date): Promise<number> {
        const query: FilterQuery<UserDocument> = { createdAt: { $gte: startDate } };
        if (endDate) {
            query.createdAt.$lt = endDate;
        }
        return await this.userModel.countDocuments(query).exec();
    }

    async countByProvider(): Promise<Map<string, number>> {
        const result = await this.userModel.aggregate([
            { $group: { _id: '$provider', count: { $sum: 1 } } }
        ]).exec();

        const map = new Map<string, number>();
        result.forEach(item => map.set(item._id || 'local', item.count));
        return map;
    }

    async getGeographicDistribution(): Promise<Array<{ country: string; userCount: number }>> {
        const result = await this.userModel.aggregate([
            { $group: { _id: '$location', userCount: { $sum: 1 } } },
            { $match: { $and: [{ _id: { $ne: null } }, { _id: { $ne: '' } }] } },
            { $sort: { userCount: -1 } },
            { $limit: 20 }
        ]).exec();

        return result.map(item => ({ country: item._id, userCount: item.userCount }));
    }

    async getGrowthMetrics(startDate: Date, groupBy: 'day' | 'month' | 'year'): Promise<Array<{ _id: string; count: number }>> {
        let dateFormat: string;
         switch (groupBy) {
            case 'month': dateFormat = '%Y-%m'; break;
            case 'year': dateFormat = '%Y'; break;
            case 'day': default: dateFormat = '%Y-%m-%d'; break;
        }

        return await this.userModel.aggregate([
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

