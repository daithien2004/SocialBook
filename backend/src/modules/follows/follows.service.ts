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
import { UsersService } from '@/src/modules/users/users.service';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private userService: UsersService,
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
      .select('username image bio') // các field cơ bản
      .lean();

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const overview = await this.userService.getUserProfileOverview(
          user._id.toString(),
        );

        return {
          _id: user._id,
          username: user.username,
          image: user.image,
          postCount: overview.postCount,
          readingListCount: overview.readingListCount,
          followersCount: overview.followersCount,
        };
      }),
    );

    return usersWithStats;
  }

  async getFollowingStatsList(targetUserId: string, currentUserId: string) {
    if (!targetUserId || !Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('User ID is required');
    }

    // Lấy tất cả follow mà userId là targetUser (những người mà targetUser đang follow)
    const follows = await this.followModel
      .find({ userId: new Types.ObjectId(targetUserId) })
      .select('targetId')
      .lean();

    if (!follows.length) return [];

    const targetIds = follows.map((f) => f.targetId as Types.ObjectId);

    // Lấy thông tin user của những người được follow
    const users = await this.userModel
      .find({ _id: { $in: targetIds } })
      .select('username image bio')
      .lean();

    // Set chứa những user mà currentUser đang follow trong nhóm này
    let currentUserFollowingSet = new Set<string>();

    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      const currentUserFollows = await this.followModel
        .find({
          userId: new Types.ObjectId(currentUserId),
          targetId: { $in: targetIds },
        })
        .select('targetId')
        .lean();

      currentUserFollowingSet = new Set(
        currentUserFollows.map((f) => f.targetId.toString()),
      );
    }

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const overview = await this.userService.getUserProfileOverview(
          user._id.toString(),
        );

        const isFollowedByCurrentUser = currentUserFollowingSet.has(
          user._id.toString(),
        );

        return {
          _id: user._id,
          username: user.username,
          image: user.image,
          postCount: overview.postCount,
          readingListCount: overview.readingListCount,
          followersCount: overview.followersCount,
          isFollowedByCurrentUser,
        };
      }),
    );

    return usersWithStats;
  }


  async toggle(currentUserId: string, targetUserId: string) {
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

  async getFollowersList(targetUserId: string, currentUserId: string) {
    if (!targetUserId || !Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Target user ID is required');
    }

    // Lấy tất cả follow mà target là userTarget
    const follows = await this.followModel
      .find({ targetId: new Types.ObjectId(targetUserId) })
      .select('userId')
      .lean();

    if (!follows.length) return [];

    const followerIds = follows.map((f) => f.userId as Types.ObjectId);

    const users = await this.userModel
      .find({ _id: { $in: followerIds } })
      .select('username image bio')
      .lean();

    let currentUserFollowingSet = new Set<string>();

    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      const currentUserFollows = await this.followModel
        .find({
          userId: new Types.ObjectId(currentUserId),
          targetId: { $in: followerIds },
        })
        .select('targetId')
        .lean();

      currentUserFollowingSet = new Set(
        currentUserFollows.map((f) => f.targetId.toString()),
      );
    }

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const overview = await this.userService.getUserProfileOverview(
          user._id.toString(),
        );

        const isFollowedByCurrentUser = currentUserFollowingSet.has(
          user._id.toString(),
        );

        return {
          _id: user._id,
          username: user.username,
          image: user.image,
          postCount: overview.postCount,
          readingListCount: overview.readingListCount,
          followersCount: overview.followersCount,
          isFollowedByCurrentUser,
        };
      }),
    );

    return usersWithStats;
  }
}
