import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Schemas
import { User, UserDocument } from '@/src/modules/users/schemas/user.schema';
import {
  Follow,
  FollowDocument,
} from '@/src/modules/follows/schemas/follow.schema';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getStatus(currentUserId: string, targetUserId: string) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid Target User ID');
    }

    if (currentUserId === targetUserId) {
      return { isOwner: true, isFollowing: false };
    }

    await this.ensureUserExists(targetUserId);

    const follow = await this.followModel.exists({
      userId: new Types.ObjectId(currentUserId),
      targetId: new Types.ObjectId(targetUserId),
    });

    return {
      isOwner: false,
      isFollowing: !!follow,
    };
  }

  async getFollowingList(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('User ID is required');
    }

    const follows = await this.followModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('targetId')
      .lean();

    if (!follows.length) return [];

    const targetIds = follows.map((f) => f.targetId);

    const users = await this.userModel
      .find({ _id: { $in: targetIds } })
      .select('username image bio') // Select field cần thiết
      .lean();

    return users;
  }

  async toggle(currentUserId: string, targetUserId: string) {
    // 1. Validation
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid Target User ID');
    }

    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    await this.ensureUserExists(targetUserId);

    const userObjectId = new Types.ObjectId(currentUserId);
    const targetObjectId = new Types.ObjectId(targetUserId);

    const existingFollow = await this.followModel.findOne({
      userId: userObjectId,
      targetId: targetObjectId,
    });

    if (existingFollow) {
      await this.followModel.deleteOne({ _id: existingFollow._id });
      return { isFollowing: false };
    } else {
      await this.followModel.create({
        userId: userObjectId,
        targetId: targetObjectId,
      });
      return { isFollowing: true };
    }
  }

  private async ensureUserExists(userId: string) {
    const exists = await this.userModel.exists({ _id: userId });
    if (!exists) {
      throw new NotFoundException('User not found');
    }
  }
}
