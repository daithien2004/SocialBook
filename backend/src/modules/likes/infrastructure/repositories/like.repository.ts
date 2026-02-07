import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { ILikeRepository } from '../../domain/repositories/like.repository.interface';
import { Like } from '../../domain/entities/like.entity';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { TargetId } from '../../domain/value-objects/target-id.vo';
import { TargetType } from '../../domain/value-objects/target-type.vo';
import { LikeSchema, LikeDocument } from '../schemas/like.schema';

interface LikePersistence {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    targetId: Types.ObjectId;
    targetType: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class LikeRepository implements ILikeRepository {
    constructor(
        @InjectModel('Like') 
        private readonly likeModel: Model<LikeDocument>
    ) {}

    private toDomain(doc: LikeDocument): Like {
        return Like.reconstitute({
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            targetId: doc.targetId.toString(),
            targetType: doc.targetType as TargetType,
            status: doc.status,
            createdAt: doc.createdAt as Date,
            updatedAt: doc.updatedAt as Date as Date
        });
    }

    private toPersistence(like: Like): LikePersistence {
        return {
            _id: new Types.ObjectId(like.id),
            userId: new Types.ObjectId(like.userId.toString()),
            targetId: new Types.ObjectId(like.targetId.toString()),
            targetType: like.targetType,
            status: like.status,
            createdAt: like.createdAt,
            updatedAt: like.updatedAt
        };
    }

    async save(like: Like): Promise<void> {
        const persistenceData = this.toPersistence(like);
        
        await this.likeModel.findOneAndUpdate(
            { 
                userId: persistenceData.userId,
                targetId: persistenceData.targetId,
                targetType: persistenceData.targetType
            },
            { $set: persistenceData },
            { upsert: true, new: true }
        ).exec();
    }

    async findByUserAndTarget(userId: UserId, targetId: TargetId, targetType: TargetType): Promise<Like | null> {
        const doc = await this.likeModel.findOne({
            userId: new Types.ObjectId(userId.toString()),
            targetId: new Types.ObjectId(targetId.toString()),
            targetType
        }).exec();
        
        return doc ? this.toDomain(doc) : null;
    }

    async findByTarget(targetId: TargetId, targetType: TargetType): Promise<Like[]> {
        const docs = await this.likeModel.find({
            targetId: new Types.ObjectId(targetId.toString()),
            targetType
        }).exec();
        
        return docs.map(doc => this.toDomain(doc));
    }

    async countByTarget(targetId: TargetId, targetType: TargetType): Promise<number> {
        return await this.likeModel.countDocuments({
            targetId: new Types.ObjectId(targetId.toString()),
            targetType,
            status: true
        }).exec();
    }

    async findLikedTargets(userId: UserId, targetIds: TargetId[], targetType: TargetType): Promise<string[]> {
        const docs = await this.likeModel.find({
            userId: new Types.ObjectId(userId.toString()),
            targetId: { $in: targetIds.map(id => new Types.ObjectId(id.toString())) },
            targetType,
            status: true
        }).select('targetId').exec();
        
        return docs.map(doc => doc.targetId.toString());
    }

    async deleteById(id: string): Promise<void> {
        await this.likeModel.findByIdAndDelete(id).exec();
    }

    async exists(userId: UserId, targetId: TargetId, targetType: TargetType): Promise<boolean> {
        const result = await this.likeModel.exists({
            userId: new Types.ObjectId(userId.toString()),
            targetId: new Types.ObjectId(targetId.toString()),
            targetType
        });
        
        return !!result;
    }
}
