import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from '../../modules/likes/schemas/like.schema';
import { GenericRepository } from '../../shared/repository/generic.repository';

@Injectable()
export class LikesRepository extends GenericRepository<LikeDocument> {
    constructor(@InjectModel(Like.name) likeModel: Model<LikeDocument>) {
        super(likeModel);
    }

    async countLikes(targetId: string | Types.ObjectId, targetType: string) {
        return this.model.countDocuments({
            targetType: targetType.toLowerCase(),
            targetId: new Types.ObjectId(targetId),
            status: true,
        });
    }

    async findStatus(userId: string | Types.ObjectId, targetId: string | Types.ObjectId, targetType: string) {
        return this.model
            .findOne(
                {
                    userId: new Types.ObjectId(userId),
                    targetType: targetType.toLowerCase(),
                    targetId: new Types.ObjectId(targetId),
                },
                { _id: 0, status: 1 }
            )
            .lean();
    }

    async aggregateLikeCounts(targetIds: Types.ObjectId[], targetType: string) {
        if (!targetIds.length) return [];
        return this.model.aggregate([
            { $match: { targetType, targetId: { $in: targetIds } } },
            { $group: { _id: '$targetId', count: { $sum: 1 } } },
        ]);
    }

    async findLikedTargets(userId: string | Types.ObjectId, targetIds: Types.ObjectId[], targetType: string) {
        if (!userId || targetIds.length === 0) return [];
        return this.model
            .find({
                userId: new Types.ObjectId(userId),
                targetType,
                targetId: { $in: targetIds },
            })
            .select('targetId')
            .lean() as Promise<{ targetId: Types.ObjectId }[]>;
    }

    async findByUserAndTarget(userId: string | Types.ObjectId, targetId: string | Types.ObjectId, targetType: string) {
        return this.model.findOne({
            userId: new Types.ObjectId(userId),
            targetType: targetType.toLowerCase(),
            targetId: new Types.ObjectId(targetId),
        });
    }

    async updateStatus(id: string | Types.ObjectId, status: boolean) {
        return this.model.updateOne(
            { _id: id },
            { $set: { status, updatedAt: new Date() } }
        ).exec();
    }
}
