import { Injectable } from '@nestjs/common';
import {ToggleLikeDto } from './dto/create-like.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from '@/src/modules/likes/schemas/like.schema';

@Injectable()
export class LikesService {

  constructor(@InjectModel(Like.name) private likeModel: Model<LikeDocument>) {}

  async toggleLike(userId: string, dto: ToggleLikeDto) {
    const filter = {
      userId: new Types.ObjectId(userId),
      targetType: dto.targetType.trim().toLowerCase(),
      targetId: new Types.ObjectId(dto.targetId), // ép kiểu rõ ràng
    };

    const existing = await this.likeModel.exists(filter).lean();

    if (existing) {
      await this.likeModel.deleteOne(filter);
      return { liked: false };
    } else {
      await this.likeModel.updateOne(
        filter,
        { $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      return { liked: true };
    }
  }

  async countByTarget(dto: ToggleLikeDto) {
    const count = await this.likeModel.countDocuments({
      targetType: dto.targetType,
      targetId: dto.targetId,
    });
    return { count };
  }

  async aggregateLikeCounts(targetIds: Types.ObjectId[], targetType: string) {
    return this.likeModel.aggregate([
      { $match: { targetType, targetId: { $in: targetIds } } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]);
  }

  async isLiked(userId: string, dto: ToggleLikeDto) {
    const exists = await this.likeModel
      .exists({
        userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
      })
      .lean();
    return { liked: Boolean(exists) };
  }
}
