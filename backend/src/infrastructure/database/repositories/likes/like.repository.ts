import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { ILikeRepository } from '@/domain/likes/repositories/like.repository.interface';
import { Like } from '@/domain/likes/entities/like.entity';
import { UserId } from '@/domain/likes/value-objects/user-id.vo';
import { TargetId } from '@/domain/likes/value-objects/target-id.vo';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { LikeDocument } from '../../schemas/like.schema';
import { LikeMapper } from './like.mapper';

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
        return LikeMapper.toDomain(doc);
    }

    private toPersistence(like: Like): LikePersistence {
        return LikeMapper.toPersistence(like);
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

