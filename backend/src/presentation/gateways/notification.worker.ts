import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from './notifications.service';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { TargetResolverRegistry } from '@/application/target-resolution/target-resolution.registry';
import {
  CommentCreatedJobPayload,
  LikeToggledJobPayload,
  UserFollowedJobPayload,
  PostModeratedJobPayload,
} from '@/application/notifications/jobs/notification-job.payload';

@Processor('notifications', {
  concurrency: 5,
})
@Injectable()
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly postRepository: IPostRepository,
    private readonly commentRepository: ICommentRepository,
    private readonly userRepository: IUserRepository,
    private readonly targetResolverRegistry: TargetResolverRegistry,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    try {
      switch (job.name) {
        case 'like.toggled':
          await this.handleLikeEvent(job.data as LikeToggledJobPayload);
          break;
        case 'comment.created':
          await this.handleCommentEvent(job.data as CommentCreatedJobPayload);
          break;
        case 'user.followed':
          await this.handleFollowEvent(job.data as UserFollowedJobPayload);
          break;
        case 'post.moderated':
          await this.handlePostModeratedEvent(
            job.data as PostModeratedJobPayload,
          );
          break;
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id} of type ${job.name}`,
        error,
      );
      throw error; // Let BullMQ handle retries
    }
  }

  private async resolveActionUrl(
    targetType: string,
    targetId: string,
  ): Promise<string | undefined> {
    const resolution = await this.targetResolverRegistry.resolve(
      targetType,
      targetId,
    );
    return resolution.actionUrl;
  }

  private async handleLikeEvent(payload: LikeToggledJobPayload) {
    const actor = await this.userRepository.findById(
      UserId.create(payload.userId),
    );
    const username = actor ? actor.username : 'Người dùng';
    const image = actor ? actor.image || '' : '';

    let ownerId: string | null = null;
    const title = 'Lượt thích mới';
    let message = `${username} đã thích nội dung của bạn`;

    if (payload.targetType === 'post') {
      const post = await this.postRepository.findById(payload.targetId);
      if (post) {
        ownerId = post.userId.toString();
        message = `${username} đã thích bài viết của bạn: "${post.content.substring(0, 30)}..."`;
      }
    } else if (payload.targetType === 'comment') {
      const comment = await this.commentRepository.findById(
        CommentId.create(payload.targetId),
      );
      if (comment) {
        ownerId = comment.userId.toString();
        message = `${username} đã thích bình luận của bạn: "${comment.content.toString().substring(0, 30)}..."`;
      }
    }

    if (ownerId && ownerId !== payload.userId) {
      const actionUrl = await this.resolveActionUrl(
        payload.targetType,
        payload.targetId,
      );

      // Check idempotency could be added here if needed,
      // but NotificationService.create might already be idempotent if we pass a unique external ID.
      // For now, let's keep it simple.
      await this.notificationsService.create({
        userId: ownerId,
        title,
        message,
        type: 'like',
        meta: {
          actorId: payload.userId,
          username,
          image,
          targetId: payload.targetId,
        },
        actionUrl,
      });
    }
  }

  private async handleCommentEvent(payload: CommentCreatedJobPayload) {
    const actor = await this.userRepository.findById(
      UserId.create(payload.userId),
    );
    const username = actor ? actor.username : 'Người dùng';
    const image = actor ? actor.image || '' : '';

    let ownerId: string | null = null;
    let title = 'Bình luận mới';
    let message = `${username} đã bình luận về nội dung của bạn`;

    if (payload.parentId) {
      const parentComment = await this.commentRepository.findById(
        CommentId.create(payload.parentId),
      );
      if (parentComment) {
        ownerId = parentComment.userId.toString();
        title = 'Phản hồi bình luận';
        message = `${username} đã trả lời bình luận của bạn`;
      }
    } else if (payload.targetType === 'post') {
      const post = await this.postRepository.findById(payload.targetId);
      if (post) {
        ownerId = post.userId.toString();
        message = `${username} đã bình luận về bài viết của bạn`;
      }
    }

    if (ownerId && ownerId !== payload.userId) {
      const actionUrl = await this.resolveActionUrl(
        payload.targetType,
        payload.targetId,
      );

      await this.notificationsService.create({
        userId: ownerId,
        title,
        message,
        type: payload.parentId ? 'reply' : 'comment',
        meta: {
          actorId: payload.userId,
          username,
          image,
          targetId: payload.targetId,
        },
        actionUrl,
      });
    }
  }

  private async handleFollowEvent(payload: UserFollowedJobPayload) {
    const actor = await this.userRepository.findById(
      UserId.create(payload.userId),
    );
    const username = actor ? actor.username : 'Người dùng';
    const image = actor ? actor.image || '' : '';

    const ownerId = payload.targetId;
    const title = 'Người theo dõi mới';
    const message = `${username} đã bắt đầu theo dõi bạn`;

    if (ownerId && ownerId !== payload.userId) {
      const actionUrl = `/users/${payload.userId}`;

      await this.notificationsService.create({
        userId: ownerId,
        title,
        message,
        type: 'follow',
        meta: {
          actorId: payload.userId,
          username,
          image,
          targetId: payload.targetId,
        },
        actionUrl,
      });
    }
  }

  private async handlePostModeratedEvent(payload: PostModeratedJobPayload) {
    const ownerId = payload.userId;
    const title = 'Bài viết bị gắn cờ vi phạm';
    let message = `Bài viết của bạn đã bị ẩn do: ${payload.reason}`;

    if (payload.action === 'BLOCK') {
      message = `Bài viết của bạn đã bị xóa do vi phạm tiêu chuẩn cộng đồng: ${payload.reason}`;
    }

    const actionUrl = `/posts/${payload.postId}`;

    await this.notificationsService.create({
      userId: ownerId,
      title,
      message,
      type: 'system',
      meta: {
        targetId: payload.postId,
      },
      actionUrl,
    });
    this.logger.log(`Created moderation notification for user ${ownerId}`);
  }
}
