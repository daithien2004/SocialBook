import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '@/infrastructure/database/schemas/comment.schema';
import { ICommentRepository, CommentFilter, PaginationOptions, SortOptions, CommentReplies, ParentResolutionResult } from '@/domain/comments/repositories/comment.repository.interface';
import { Comment as CommentEntity } from '@/domain/comments/entities/comment.entity';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { UserId } from '@/domain/comments/value-objects/user-id.vo';
import { TargetId } from '@/domain/comments/value-objects/target-id.vo';
import { CommentTargetType } from '@/domain/comments/value-objects/comment-target-type.vo';
import { CommentDepth } from '@/domain/comments/value-objects/comment-depth.vo';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { CommentMapper } from './comment.mapper';
import { CommentModel } from '@/domain/comments/read-models/comment-model';

@Injectable()
export class CommentRepository implements ICommentRepository {
    private readonly logger = new Logger(CommentRepository.name);

    constructor(@InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>) { }

    async findById(id: CommentId): Promise<CommentEntity | null> {
        const document = await this.commentModel.findById(id.toString()).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findByTarget(
        targetId: TargetId,
        targetType: CommentTargetType,
        parentId?: CommentId | null,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<CommentModel>> {
        const queryFilter: FilterQuery<CommentDocument> = {
            targetId: new Types.ObjectId(targetId.toString()),
            targetType: targetType.toString(),
            isDeleted: false
        };

        if (parentId) {
            queryFilter.parentId = new Types.ObjectId(parentId.toString());
        } else {
            queryFilter.parentId = null;
        }

        return this.executeQuery(queryFilter, pagination, sort);
    }

    async findByUser(
        userId: UserId,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<CommentModel>> {
        const queryFilter: FilterQuery<CommentDocument> = {
            userId: new Types.ObjectId(userId.toString()),
            isDeleted: false
        };

        return this.executeQuery(queryFilter, pagination, sort);
    }

    async findByParent(
        parentId: CommentId,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<CommentModel>> {
        const queryFilter: FilterQuery<CommentDocument> = {
            parentId: new Types.ObjectId(parentId.toString()),
            isDeleted: false
        };

        return this.executeQuery(queryFilter, pagination, sort);
    }

    async findTopLevel(
        targetId: TargetId,
        targetType: CommentTargetType,
        pagination?: PaginationOptions,
        sort?: SortOptions
    ): Promise<PaginatedResult<CommentModel>> {
        const queryFilter: FilterQuery<CommentDocument> = {
            targetId: new Types.ObjectId(targetId.toString()),
            targetType: targetType.toString(),
            parentId: null,
            isDeleted: false
        };

        return this.executeQuery(queryFilter, pagination, sort);
    }

    async save(comment: CommentEntity): Promise<void> {
        const document = this.mapToDocument(comment);
        await this.commentModel.findByIdAndUpdate(
            comment.id.toString(),
            document,
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: CommentId): Promise<void> {
        await this.commentModel.findByIdAndDelete(id.toString()).exec();
    }

    async softDelete(id: CommentId): Promise<void> {
        await this.commentModel.findByIdAndUpdate(
            id.toString(),
            { isDeleted: true, updatedAt: new Date() }
        ).exec();
    }

    async existsByUserAndTarget(
        userId: UserId,
        targetId: TargetId,
        targetType: CommentTargetType,
        content?: string
    ): Promise<boolean> {
        const queryFilter: FilterQuery<CommentDocument> = {
            userId: new Types.ObjectId(userId.toString()),
            targetId: new Types.ObjectId(targetId.toString()),
            targetType: targetType.toString(),
            isDeleted: false
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
        parentId?: CommentId | null
    ): Promise<number> {
        const queryFilter: FilterQuery<CommentDocument> = {
            targetId: new Types.ObjectId(targetId.toString()),
            targetType: targetType.toString(),
            isDeleted: false
        };

        if (parentId) {
            queryFilter.parentId = new Types.ObjectId(parentId.toString());
        } else if (parentId === null) {
            queryFilter.parentId = null;
        }

        return await this.commentModel.countDocuments(queryFilter).exec();
    }

    async countByUser(userId: UserId): Promise<number> {
        return await this.commentModel.countDocuments({
            userId: new Types.ObjectId(userId.toString()),
            isDeleted: false
        }).exec();
    }

    async countByModerationStatus(status: 'pending' | 'approved' | 'rejected'): Promise<number> {
        return await this.commentModel.countDocuments({
            moderationStatus: status,
            isDeleted: false
        }).exec();
    }

    async countFlagged(): Promise<number> {
        return await this.commentModel.countDocuments({
            isFlagged: true,
            isDeleted: false
        }).exec();
    }

    async findFlagged(pagination?: PaginationOptions): Promise<PaginatedResult<CommentModel>> {
        const queryFilter: FilterQuery<CommentDocument> = {
            isFlagged: true,
            isDeleted: false
        };

        const sortOptions: SortOptions = {
            sortBy: 'createdAt',
            order: 'desc'
        };

        return this.executeQuery(queryFilter, pagination, sortOptions);
    }

    async findPendingModeration(pagination?: PaginationOptions): Promise<PaginatedResult<CommentModel>> {
        const queryFilter: FilterQuery<CommentDocument> = {
            moderationStatus: 'pending',
            isDeleted: false
        };

        const sortOptions: SortOptions = {
            sortBy: 'createdAt',
            order: 'desc'
        };

        return this.executeQuery(queryFilter, pagination, sortOptions);
    }

    async findRejected(pagination?: PaginationOptions): Promise<PaginatedResult<CommentModel>> {
        const queryFilter: FilterQuery<CommentDocument> = {
            moderationStatus: 'rejected',
            isDeleted: false
        };

        const sortOptions: SortOptions = {
            sortBy: 'createdAt',
            order: 'desc'
        };

        return this.executeQuery(queryFilter, pagination, sortOptions);
    }

    async search(filter: CommentFilter, pagination?: PaginationOptions, sort?: SortOptions): Promise<PaginatedResult<CommentModel>> {
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

        return this.executeQuery(queryFilter, pagination, sort);
    }

    async getRepliesTree(
        targetId: TargetId,
        targetType: CommentTargetType,
        maxDepth?: number
    ): Promise<CommentReplies[]> {
        // This is a complex operation that would require recursive queries
        // For now, return top-level comments
        const topLevelComments = await this.findTopLevel(targetId, targetType);

        return topLevelComments.data.map(comment => ({
            comment,
            replies: [], // Would need to fetch replies recursively
            totalReplies: 0
        }));
    }

    async updateLikesCount(id: CommentId, increment: boolean): Promise<void> {
        const update = increment ?
            { $inc: { likesCount: 1 }, updatedAt: new Date() } :
            { $inc: { likesCount: -1 }, updatedAt: new Date() };

        await this.commentModel.findByIdAndUpdate(id.toString(), update).exec();
    }

    async updateModerationStatus(id: CommentId, status: 'pending' | 'approved' | 'rejected', reason?: string): Promise<void> {
        const update: any = {
            moderationStatus: status,
            updatedAt: new Date()
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
        await this.commentModel.findByIdAndUpdate(id.toString(), {
            isFlagged: true,
            moderationReason: reason,
            updatedAt: new Date()
        }).exec();
    }

    async unflagComment(id: CommentId): Promise<void> {
        await this.commentModel.findByIdAndUpdate(id.toString(), {
            isFlagged: false,
            moderationReason: '',
            updatedAt: new Date()
        }).exec();
    }

    async getRecentComments(pagination?: PaginationOptions): Promise<PaginatedResult<CommentModel>> {
        const queryFilter: FilterQuery<CommentDocument> = {
            moderationStatus: 'approved',
            isDeleted: false
        };

        const sortOptions: SortOptions = {
            sortBy: 'createdAt',
            order: 'desc'
        };

        return this.executeQuery(queryFilter, pagination, sortOptions);
    }

    async getPopularComments(pagination?: PaginationOptions): Promise<PaginatedResult<CommentModel>> {
        const queryFilter: FilterQuery<CommentDocument> = {
            moderationStatus: 'approved',
            isDeleted: false
        };

        const sortOptions: SortOptions = {
            sortBy: 'likesCount',
            order: 'desc'
        };

        return this.executeQuery(queryFilter, pagination, sortOptions);
    }

    async batchDelete(ids: CommentId[]): Promise<void> {
        const objectIds = ids.map(id => new Types.ObjectId(id.toString()));
        await this.commentModel.deleteMany({
            _id: { $in: objectIds }
        }).exec();
    }

    async batchModerate(ids: CommentId[], status: 'approved' | 'rejected', reason?: string): Promise<void> {
        const objectIds = ids.map(id => new Types.ObjectId(id.toString()));
        const update: any = {
            moderationStatus: status,
            updatedAt: new Date()
        };

        if (status === 'approved') {
            update.isFlagged = false;
            update.moderationReason = '';
        } else if (status === 'rejected') {
            update.isFlagged = true;
            update.moderationReason = reason || '';
        }

        await this.commentModel.updateMany(
            { _id: { $in: objectIds } },
            update
        ).exec();
    }

    private async executeQuery(
        filter: FilterQuery<CommentDocument>,
        pagination?: PaginationOptions,
        sort?: SortOptions,
    ): Promise<PaginatedResult<CommentModel>> {

        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 10;
        const skip = (page - 1) * limit;

        let query = this.commentModel
            .find(filter)
            .populate('userId', 'username image')
            .lean();

        if (sort?.sortBy) {
            const order = sort.order === 'desc' ? -1 : 1;
            query = query.sort({ [sort.sortBy]: order });
        } else {
            query = query.sort({ createdAt: -1 });
        }

        if (pagination?.cursor) {
            query = query.where({
                _id: { $gt: new Types.ObjectId(pagination.cursor) },
            });
        } else {
            query = query.skip(skip).limit(limit);
        }

        const [documents, total] = await Promise.all([
            query.exec(),
            this.commentModel.countDocuments(filter).exec(),
        ]);

        return {
            data: documents.map((doc: any): CommentModel => ({
                id: doc._id.toString(),
                content: doc.content,
                targetId: doc.targetId.toString(),
                targetType: doc.targetType,
                parentId: doc.parentId ? doc.parentId.toString() : null,
                likesCount: doc.likesCount,
                isFlagged: doc.isFlagged,
                moderationStatus: doc.moderationStatus,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
                user: {
                    id: doc.userId._id.toString(),
                    username: doc.userId.username,
                    image: doc.userId.image,
                },
            })),
            meta: {
                current: page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
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

        const target = await this.commentModel
            .findById(parentId)
            .select('_id targetId targetType parentId')
            .lean() as any;

        if (!target) {
            throw new NotFoundException('Parent comment not found');
        }

        if (target.targetId.toString() !== targetId.toString()) {
            throw new ForbiddenException(
                'Parent comment does not belong to this target',
            );
        }

        if (target.targetType !== targetType.toString()) {
            throw new ForbiddenException(
                'Parent comment target type mismatch',
            );
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
            .lean() as any;
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

