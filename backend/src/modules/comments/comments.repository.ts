import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { GenericRepository } from '../../shared/repository/generic.repository';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsRepository extends GenericRepository<CommentDocument> {
    constructor(@InjectModel(Comment.name) commentModel: Model<CommentDocument>) {
        super(commentModel);
    }

    async findByTargetRaw(filter: FilterQuery<CommentDocument>, limit: number): Promise<CommentDocument[]> {
        return this.model
            .find(filter)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate('userId', 'username image')
            .lean()
            .exec() as unknown as CommentDocument[];
    }

    async findByIdSelected(id: string | Types.ObjectId, select: string): Promise<CommentDocument | null> {
        return this.model.findById(id).select(select).lean().exec() as unknown as CommentDocument;
    }

    async aggregateReplyCounts(parentIds: Types.ObjectId[]) {
        if (parentIds.length === 0) return [];
        return this.model.aggregate([
            { $match: { parentId: { $in: parentIds } } },
            { $group: { _id: '$parentId', count: { $sum: 1 } } },
        ]);
    }

    async countByTarget(targetId: string | Types.ObjectId, targetType: string) {
        return this.model.countDocuments({
            targetId: new Types.ObjectId(targetId),
            targetType: targetType.toLowerCase(),
        });
    }

    async countByParentId(parentId: string | Types.ObjectId) {
        return this.model.countDocuments({
            parentId: new Types.ObjectId(parentId),
            isDelete: false,
        });
    }

    async createComment(data: Partial<CommentDocument>): Promise<CommentDocument | null> {
        const newComment = await this.create(data);
        return this.model
            .findById(newComment._id)
            .populate('userId', 'username image')
            .lean()
            .exec() as unknown as CommentDocument;
    }

    async softDelete(id: string | Types.ObjectId, errorMsg = 'Not found'): Promise<void> {
        const result = await this.model.findByIdAndUpdate(id, {
            isDelete: true,
            content: 'Bình luận đã bị xóa',
            updatedAt: new Date(),
        }).exec();
        if (!result) throw new Error(errorMsg);
    }
}
