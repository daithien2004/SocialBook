import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

// DTOs
import { ToggleLikeDto } from './dto/create-like.dto';
import { NotificationsService } from '@/src/modules/notifications/notifications.service';
import { CommentTargetType } from '@/src/modules/comments/constants/targetType.constant';

import { UsersRepository } from '@/src/data-access/repositories/users.repository';
import { PostsRepository } from '@/src/data-access/repositories/posts.repository';
import { CommentsRepository } from '@/src/data-access/repositories/comments.repository';
import { LikesRepository } from '@/src/data-access/repositories/likes.repository';

@Injectable()
export class LikesService {
  constructor(
    private readonly likesRepository: LikesRepository,
    private readonly postsRepository: PostsRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notifications: NotificationsService,
  ) { }

  async getCount(dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;

    if (!Types.ObjectId.isValid(targetId)) return { count: 0 };

    const count = await this.likesRepository.countLikes(targetId, targetType);

    return { count };
  }

  async checkStatus(userId: string, dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;

    if (!Types.ObjectId.isValid(targetId) || !Types.ObjectId.isValid(userId)) {
      return { isLiked: false };
    }

    const normalizedType = targetType.toLowerCase();

    const like = await this.likesRepository.findStatus(userId, targetId, targetType);

    return { isLiked: like?.status };
  }


  // Internal Helper (Used by Comments Service)
  async aggregateLikeCounts(targetIds: Types.ObjectId[], targetType: string) {
    if (!targetIds.length) return [];

    return this.likesRepository.aggregateLikeCounts(targetIds, targetType);
  }

  async getLikedTargets(
    userId: string,
    targetIds: Types.ObjectId[],
    targetType: string,
  ): Promise<Set<string>> {
    if (!userId || targetIds.length === 0) return new Set();

    const likes = await this.likesRepository.findLikedTargets(userId, targetIds, targetType);

    return new Set(likes.map((like) => like.targetId.toString()));
  }

  async toggle(userId: string, dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;

    if (!Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException('Invalid Target ID');
    }

    const normalizedType = targetType.toLowerCase() as CommentTargetType;

    const filter = {
      userId: new Types.ObjectId(userId),
      targetType: normalizedType,
      targetId: new Types.ObjectId(targetId),
    };

    // Tìm like hiện tại (nếu có)
    const existing = await this.likesRepository.findByUserAndTarget(userId, targetId, normalizedType);

    if (!existing) {
      await this.likesRepository.create({
        ...filter,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.createLikeNotification(userId, normalizedType, targetId);

      return { isLiked: true };
    }

    const updatedStatus = !existing.status;

    await this.likesRepository.updateStatus(existing._id, updatedStatus);
    return { isLiked: updatedStatus };
  }

  private async createLikeNotification(
    actorId: string,
    targetType: string,
    targetId: string,
  ) {
    let ownerId: string | null = null;
    let title = 'Ai đó đã thích nội dung của bạn';
    let message = 'Bạn có một lượt thích mới.';
    let actionUrl = '';

    // 🔹 Lấy thông tin người hành động
    const actor = await this.usersRepository.findByIdSelected(actorId, '_id username image') as { _id: Types.ObjectId; username: string; image?: string } | null;

    if (!actor) return;

    if (targetType === 'post') {
      const post = await this.postsRepository.findByIdSelected(targetId, '_id userId content') as { _id: Types.ObjectId; userId: Types.ObjectId; content: string } | null;

      if (!post) return;

      ownerId = post.userId.toString();
      title = `${actor.username} đã thích bài viết của bạn`;
      message = `Bài viết "${post.content}" vừa nhận được một lượt thích.`;
      actionUrl = `/posts/${post._id}`;

    } else if (targetType === 'comment') {
      const comment = await this.commentsRepository.findByIdSelected(targetId, '_id userId content targetId') as { _id: Types.ObjectId; userId: Types.ObjectId; content: string; targetId: Types.ObjectId } | null;

      if (!comment) return;

      ownerId = comment.userId.toString();
      title = `${actor.username} đã thích bình luận của bạn`;
      message = `Bình luận "${comment.content}" vừa được thích.`;
      actionUrl = `/posts/${comment.targetId}`;

    } else {
      return;
    }

    if (!ownerId || ownerId === actorId) {
      return;
    }

    await this.notifications.create({
      userId: ownerId,
      title,
      message,
      type: 'like',
      actionUrl,
      meta: {
        actorId: actor._id.toString(),
        username: actor.username,
        image: actor.image,
        targetId,
      },
    });
  }
}
