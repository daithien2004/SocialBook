import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

// Schemas
import { ErrorMessages } from '@/src/common/constants/error-messages';
import { NotificationsService } from '@/src/modules/notifications/notifications.service';
import { UsersService } from '@/src/modules/users/users.service';
import { UsersRepository } from '../users/users.repository';
import { FollowsRepository } from './follows.repository';

@Injectable()
export class FollowsService {
  constructor(
    private readonly followsRepository: FollowsRepository,
    private readonly userService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly notifications: NotificationsService
  ) { }

  async getStatus(currentUserId: string, targetUserId: string) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    if (currentUserId === targetUserId) {
      return { isOwner: true, isFollowing: false };
    }

    await this.ensureUserExists(targetUserId);

    const follow = await this.followsRepository.existsFollowing(currentUserId, targetUserId);

    return {
      isOwner: false,
      isFollowing: !!follow,
    };
  }

  async getFollowingList(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const follows = await this.followsRepository.findFollowingIds(userId);

    if (!follows.length) return [];

    const targetIds = follows.map((f) => f.targetId);

    const users = await this.usersRepository.findByIds(targetIds, 'username image bio');

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
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    // Lấy tất cả follow mà userId là targetUser (những người mà targetUser đang follow)
    const follows = await this.followsRepository.findFollowingIds(targetUserId);

    if (!follows.length) return [];

    const targetIds = follows.map((f) => f.targetId as Types.ObjectId);

    // Lấy thông tin user của những người được follow
    const users = await this.usersRepository.findByIds(targetIds, 'username image bio');

    // Set chứa những user mà currentUser đang follow trong nhóm này
    let currentUserFollowingSet = new Set<string>();

    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      const currentUserFollows = await this.followsRepository.findFollowedTargetsByUser(currentUserId, targetIds);

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
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }
    if (currentUserId === targetUserId) {
      throw new BadRequestException(ErrorMessages.CANNOT_FOLLOW_SELF);
    }

    await this.ensureUserExists(targetUserId);

    const userObjectId = new Types.ObjectId(currentUserId);
    const targetObjectId = new Types.ObjectId(targetUserId);

    const existing = await this.followsRepository.findByUserAndTarget(userObjectId, targetObjectId);

    if (existing) {
      const nextStatus = !existing.status;

      await this.followsRepository.updateStatus(existing._id, nextStatus);

      if (!nextStatus) {
        return { isFollowing: false };
      }
    } else {
      await this.followsRepository.create({
        userId: userObjectId,
        targetId: targetObjectId,
        status: true,
      });
    }

    const actor = await this.usersRepository.findById(currentUserId, '_id username image');

    if (!actor) {
      return { isFollowing: true };
    }

    await this.notifications.create({
      userId: targetUserId,
      title: 'Bạn có người theo dõi mới',
      message: `${actor.username} vừa theo dõi bạn.`,
      type: 'follow',
      actionUrl: `/users/${actor._id}`,
      meta: {
        actorId: actor._id.toString(),
        username: actor.username,
        image: actor.image,
        targetId: targetUserId,
      },
    });

    return { isFollowing: true };
  }


  private async ensureUserExists(userId: string) {
    const exists = await this.usersRepository.existsById(userId);
    if (!exists) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }
  }

  async getFollowersList(targetUserId: string, currentUserId: string) {
    if (!targetUserId || !Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    // Lấy tất cả follow mà target là userTarget
    const follows = await this.followsRepository.findFollowerIds(targetUserId);

    if (!follows.length) return [];

    const followerIds = follows.map((f) => f.userId as Types.ObjectId);

    const users = await this.usersRepository.findByIds(followerIds, 'username image bio');

    let currentUserFollowingSet = new Set<string>();

    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      const currentUserFollows = await this.followsRepository.findFollowedTargetsByUser(currentUserId, followerIds);

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
