import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GenericRepository } from '../../shared/repository/generic.repository';
import { Follow, FollowDocument } from './schemas/follow.schema';

@Injectable()
export class FollowsRepository extends GenericRepository<FollowDocument> {
    constructor(@InjectModel(Follow.name) followModel: Model<FollowDocument>) {
        super(followModel);
    }

    async findByUserAndTarget(userId: string | Types.ObjectId, targetId: string | Types.ObjectId) {
        return this.model
            .findOne({ userId, targetId })
            .lean()
            .exec();
    }

    async existsFollowing(userId: string | Types.ObjectId, targetId: string | Types.ObjectId): Promise<boolean> {
        const result = await this.model.exists({ userId, targetId, status: true });
        return !!result;
    }

    async findFollowingIds(userId: string | Types.ObjectId) {
        return this.model
            .find({ userId, status: true })
            .select('targetId')
            .lean()
            .exec() as Promise<{ targetId: Types.ObjectId }[]>;
    }

    async findFollowerIds(targetId: string | Types.ObjectId) {
        return this.model
            .find({ targetId, status: true })
            .select('userId')
            .lean()
            .exec() as Promise<{ userId: Types.ObjectId }[]>;
    }

    async findFollowedTargetsByUser(userId: string | Types.ObjectId, targetIds: Types.ObjectId[]) {
        return this.model
            .find({
                userId,
                targetId: { $in: targetIds },
                status: true,
            })
            .select('targetId')
            .lean()
            .exec() as Promise<{ targetId: Types.ObjectId }[]>;
    }

    async updateStatus(id: string | Types.ObjectId, status: boolean) {
        return this.model.updateOne(
            { _id: id },
            { $set: { status, updatedAt: new Date() } }
        ).exec();
    }

    async countFollowers(targetId: string | Types.ObjectId): Promise<number> {
        return this.model.countDocuments({ targetId, status: true }).exec();
    }
}
