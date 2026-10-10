import { Like } from '@/modules/likes/domain/entities/like.entity';
import { ILikeRepository } from '@/modules/likes/domain/repositories/like.repository.interface';
import { TargetId } from '@/modules/likes/domain/value-objects/target-id.vo';
import { TargetType } from '@/modules/likes/domain/value-objects/target-type.vo';
import { UserId } from '@/modules/likes/domain/value-objects/user-id.vo';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LikeDocument } from '../schemas/like.schema';
import { LikeMapper } from './like.mapper';
import { LikePersistence } from './like.mapper';

@Injectable()
export class LikeRepository implements ILikeRepository {
  constructor(
    @InjectModel('Like')
    private readonly likeModel: Model<LikeDocument>,
  ) {}

  private toDomain(doc: LikeDocument): Like {
    return LikeMapper.toDomain(doc);
  }

  private toPersistence(like: Like): LikePersistence {
    return LikeMapper.toPersistence(like);
  }

  async save(like: Like): Promise<void> {
    const persistenceData = this.toPersistence(like);
    const { _id, ...updateData } = persistenceData;
    _id;

    await this.likeModel
      .findOneAndUpdate(
        {
          userId: persistenceData.userId,
          targetId: persistenceData.targetId,
          targetType: persistenceData.targetType,
        },
        { $set: updateData },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findByUserAndTarget(
    userId: UserId,
    targetId: TargetId,
    targetType: TargetType,
  ): Promise<Like | null> {
    const doc = await this.likeModel
      .findOne({
        userId: new Types.ObjectId(userId.toString()),
        targetId: new Types.ObjectId(targetId.toString()),
        targetType,
      })
      .lean()
      .exec();

    return doc ? this.toDomain(doc) : null;
  }

  async countByTarget(
    targetId: TargetId,
    targetType: TargetType,
  ): Promise<number> {
    return await this.likeModel
      .countDocuments({
        targetId: new Types.ObjectId(targetId.toString()),
        targetType,
        status: true,
      })
      .exec();
  }
}
