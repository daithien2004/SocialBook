import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '@/src/modules/users/schemas/user.schema';
import { Follow, FollowDocument } from '@/src/modules/follows/schemas/follow.schema';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
  }

  private async ensureTargetUserExists(targetUserId: Types.ObjectId) {
    const user = await this.userModel.findById(targetUserId).select('_id').lean();
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
  }

  async getFollowState(currentUserId: Types.ObjectId, targetUserId: Types.ObjectId) {
    if (String(currentUserId) === String(targetUserId)) {
      return { isOwner: true, isFollowing: false };
    }

    await this.ensureTargetUserExists(targetUserId);

    const follow = await this.followModel
      .findOne({
        userId: currentUserId,
        targetId: targetUserId,
      })
      .lean();
    console.log(follow);
    return {
      data:{
        isOwner: false,
        isFollowing: !!follow,
      },
      message: "Kiểm tra thành công"
    };
  }

  async toggleFollowUser(currentUserId: Types.ObjectId, targetUserId: Types.ObjectId) {
    if (String(currentUserId) === String(targetUserId)) {
      throw new BadRequestException('Không thể theo dõi chính mình');
    }

    await this.ensureTargetUserExists(targetUserId);

    const existing = await this.followModel.findOne({
      userId: currentUserId,
      targetId: targetUserId,
    });

    if (existing) {
      await this.followModel.deleteOne({ _id: existing._id });

      return {
        data: {
          isFollowing: false,
        },
        message: 'Bỏ theo dõi thành công',
      };
    }

    await this.followModel.create({
      userId: currentUserId,
      targetId: targetUserId,
    });

    return {
      data: {
        isFollowing: true,
      },
      message: 'Theo dõi thành công',
    };
  }

  async getFollowingList(currentUserId: Types.ObjectId) {
    const follows = await this.followModel
      .find({ userId: currentUserId })
      .select("targetId")
      .lean();

    if (follows.length === 0) {
      return {
        data: [],
        message: "Bạn chưa theo dõi ai",
      };
    }

    const targetIds = follows.map((f) => f.targetId);

    const users = await this.userModel
      .find({ _id: { $in: targetIds } })
      .select("_id image")
      .lean();

    return {
      data: users,
      message: "Lấy danh sách đang theo dõi thành công",
    };
  }

}
