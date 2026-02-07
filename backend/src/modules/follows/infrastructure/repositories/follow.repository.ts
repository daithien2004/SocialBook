import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Follow, FollowDocument } from '../schemas/follow.schema';
import { IFollowRepository, FollowFilter, PaginationOptions, SortOptions, FollowStatusResult, FollowStats } from '../../domain/repositories/follow.repository.interface';
import { Follow as FollowEntity } from '../../domain/entities/follow.entity';
import { FollowId } from '../../domain/value-objects/follow-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { TargetId } from '../../domain/value-objects/target-id.vo';
import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';

@Injectable()
export class FollowRepository implements IFollowRepository {
    constructor(@InjectModel(Follow.name) private readonly followModel: Model<FollowDocument>) {}

    async findById(id: FollowId): Promise<FollowEntity | null> {
        const document = await this.followModel.findById(id.toString()).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findByUser(userId: UserId, pagination?: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<FollowEntity>> {
        const queryFilter: FilterQuery<FollowDocument> = {
            userId: new Types.ObjectId(userId.toString()),
            status: true
        };

        return this.executeQuery(queryFilter, pagination, sort);
    }

    async findByTarget(targetId: TargetId, pagination?: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<FollowEntity>> {
        const queryFilter: FilterQuery<FollowDocument> = {
            targetId: new Types.ObjectId(targetId.toString()),
            status: true
        };

        return this.executeQuery(queryFilter, pagination, sort);
    }

    async findAll(filter: FollowFilter, pagination?: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<FollowEntity>> {
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

        return this.executeQuery(queryFilter, pagination, sort);
    }

    async save(follow: FollowEntity): Promise<void> {
        const document = this.mapToDocument(follow);
        await this.followModel.findByIdAndUpdate(
            follow.id.toString(),
            document,
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: FollowId): Promise<void> {
        await this.followModel.findByIdAndDelete(id.toString()).exec();
    }

    async softDelete(id: FollowId): Promise<void> {
        await this.followModel.findByIdAndUpdate(id.toString(), { status: false, updatedAt: new Date() }).exec();
    }

    async exists(userId: UserId, targetId: TargetId): Promise<FollowEntity | null> {
        const document = await this.followModel.findOne({
            userId: new Types.ObjectId(userId.toString()),
            targetId: new Types.ObjectId(targetId.toString())
        }).lean().exec();

        return document ? this.mapToEntity(document) : null;
    }

    async getFollowStatus(userId: UserId, targetId: TargetId): Promise<FollowStatusResult> {
        const follow = await this.followModel.findOne({
            userId: new Types.ObjectId(userId.toString()),
            targetId: new Types.ObjectId(targetId.toString())
        }).lean().exec();

        return {
            userId: userId.toString(),
            targetId: targetId.toString(),
            isFollowing: follow ? follow.status : false,
            isOwner: userId.getValue() === targetId.getValue(),
            followId: follow ? follow._id.toString() : undefined
        };
    }

    async countFollowing(userId: UserId): Promise<number> {
        return await this.followModel.countDocuments({
            userId: new Types.ObjectId(userId.toString()),
            status: true
        }).exec();
    }

    async countFollowers(targetId: TargetId): Promise<number> {
        return await this.followModel.countDocuments({
            targetId: new Types.ObjectId(targetId.toString()),
            status: true
        }).exec();
    }

    async countActiveFollows(): Promise<number> {
        return await this.followModel.countDocuments({ status: true }).exec();
    }

    async countInactiveFollows(): Promise<number> {
        return await this.followModel.countDocuments({ status: false }).exec();
    }

    async getFollowingIds(userId: UserId): Promise<string[]> {
        const documents = await this.followModel.find({
            userId: new Types.ObjectId(userId.toString()),
            status: true
        }).select('targetId').lean().exec();

        return documents.map(doc => doc.targetId.toString());
    }

    async getFollowerIds(targetId: TargetId): Promise<string[]> {
        const documents = await this.followModel.find({
            targetId: new Types.ObjectId(targetId.toString()),
            status: true
        }).select('userId').lean().exec();

        return documents.map(doc => doc.userId.toString());
    }

    async findMutualFollows(userId1: UserId, userId2: UserId): Promise<FollowEntity[]> {
        // Find users that both userId1 and userId2 are following
        const following1 = await this.getFollowingIds(userId1);
        const following2 = await this.getFollowingIds(userId2);

        const mutualIds = following1.filter(id => following2.includes(id));

        if (mutualIds.length === 0) return [];

        const documents = await this.followModel.find({
            userId: new Types.ObjectId(userId1.toString()),
            targetId: { $in: mutualIds.map(id => new Types.ObjectId(id)) },
            status: true
        }).lean().exec();

        return documents.map(doc => this.mapToEntity(doc));
    }

    async getFollowStats(userId: UserId): Promise<FollowStats> {
        const [totalFollowing, totalFollowers, recentFollows] = await Promise.all([
            this.countFollowing(userId),
            this.countFollowers(TargetId.create(userId.toString())),
            this.getRecentFollows({ page: 1, limit: 5 })
        ]);

        return {
            totalFollowing,
            totalFollowers,
            followingCount: totalFollowing,
            followersCount: totalFollowers,
            recentFollows: recentFollows.data
        };
    }

    async batchDelete(ids: FollowId[]): Promise<void> {
        const objectIds = ids.map(id => new Types.ObjectId(id.toString()));
        await this.followModel.deleteMany({ _id: { $in: objectIds } }).exec();
    }

    async batchUpdateStatus(ids: FollowId[], status: boolean): Promise<void> {
        const objectIds = ids.map(id => new Types.ObjectId(id.toString()));
        await this.followModel.updateMany(
            { _id: { $in: objectIds } },
            { status, updatedAt: new Date() }
        ).exec();
    }

    async getRecentFollows(pagination?: PaginationOptions): Promise<PaginatedResult<FollowEntity>> {
        const queryFilter: FilterQuery<FollowDocument> = { status: true };
        const sortOptions: SortOptions = { sortBy: 'createdAt', order: 'desc' };

        return this.executeQuery(queryFilter, pagination, sortOptions);
    }

    async getPopularFollows(pagination?: PaginationOptions): Promise<PaginatedResult<FollowEntity>> {
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
            userId: userId.toString(),
            targetId: targetId.toString(),
            status: true
        });

        await this.save(follow);
        return follow;
    }

    async unfollowUser(userId: UserId, targetId: TargetId): Promise<FollowEntity> {
        const existingFollow = await this.exists(userId, targetId);

        if (existingFollow) {
            existingFollow.deactivate();
            await this.save(existingFollow);
            return existingFollow;
        }

        const follow = FollowEntity.create({
            userId: userId.toString(),
            targetId: targetId.toString(),
            status: false
        });

        await this.save(follow);
        return follow;
    }

    async toggleFollow(userId: UserId, targetId: TargetId): Promise<FollowEntity> {
        const existingFollow = await this.exists(userId, targetId);

        if (existingFollow) {
            existingFollow.toggleStatus();
            await this.save(existingFollow);
            return existingFollow;
        }

        return this.followUser(userId, targetId);
    }

    private async executeQuery(
        filter: FilterQuery<FollowDocument>,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<FollowEntity>> {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const skip = (page - 1) * limit;

        let query = this.followModel.find(filter);

        if (sort?.sortBy) {
            const sortOrder = sort.order === 'desc' ? -1 : 1;
            query = query.sort({ [sort.sortBy]: sortOrder });
        } else {
            query = query.sort({ createdAt: -1 });
        }

        query = query.skip(skip).limit(limit);

        const [documents, total] = await Promise.all([
            query.lean().exec(),
            this.followModel.countDocuments(filter).exec()
        ]);

        return {
            data: documents.map(doc => this.mapToEntity(doc)),
            meta: {
                current: page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    private mapToEntity(document: any): FollowEntity {
        return FollowEntity.reconstitute({
            id: document._id.toString(),
            userId: document.userId?.toString() || '',
            targetId: document.targetId?.toString() || '',
            status: document.status,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        });
    }

    private mapToDocument(follow: FollowEntity): Partial<FollowDocument> {
        return {
            userId: new Types.ObjectId(follow.userId.toString()),
            targetId: new Types.ObjectId(follow.targetId.toString()),
            status: follow.status.getValue(),
            updatedAt: follow.updatedAt,
        };
    }
}
