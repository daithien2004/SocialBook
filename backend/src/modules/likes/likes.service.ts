import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Schemas
import { Like, LikeDocument } from './schemas/like.schema';

// DTOs
import { ToggleLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikesService {
  constructor(@InjectModel(Like.name) private likeModel: Model<LikeDocument>) {}

  async toggle(userId: string, dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;

    if (!Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException('Invalid Target ID');
    }

    const filter = {
      userId: new Types.ObjectId(userId),
      targetType: targetType.toLowerCase(), // Normalize
      targetId: new Types.ObjectId(targetId),
    };

    // Sử dụng exists() nhẹ hơn findOne() nếu chỉ cần check tồn tại
    const existing = await this.likeModel.exists(filter);

    if (existing) {
      await this.likeModel.deleteOne(filter);
      return { isLiked: false };
    } else {
      await this.likeModel.create({
        ...filter,
        createdAt: new Date(),
      });
      return { isLiked: true };
    }
  }

  async getCount(dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;

    if (!Types.ObjectId.isValid(targetId)) return { count: 0 };

    const count = await this.likeModel.countDocuments({
      targetType: targetType.toLowerCase(),
      targetId: new Types.ObjectId(targetId),
    });

    return { count };
  }

  async checkStatus(userId: string, dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;
    if (!Types.ObjectId.isValid(targetId)) return { isLiked: false };

    const exists = await this.likeModel.exists({
      userId: new Types.ObjectId(userId),
      targetType: targetType.toLowerCase(),
      targetId: new Types.ObjectId(targetId),
    });

    return { isLiked: !!exists };
  }

  // Internal Helper (Used by Comments Service)
  async aggregateLikeCounts(targetIds: Types.ObjectId[], targetType: string) {
    if (!targetIds.length) return [];

    return this.likeModel.aggregate([
      { $match: { targetType, targetId: { $in: targetIds } } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]);
  }

  async getLikedTargets(
    userId: string,
    targetIds: Types.ObjectId[],
    targetType: string,
  ): Promise<Set<string>> {
    if (!userId || targetIds.length === 0) return new Set();

    const likes = await this.likeModel
      .find({
        userId: new Types.ObjectId(userId),
        targetType,
        targetId: { $in: targetIds },
      })
      .select('targetId')
      .lean();

    return new Set(likes.map((like) => like.targetId.toString()));
  }
}
