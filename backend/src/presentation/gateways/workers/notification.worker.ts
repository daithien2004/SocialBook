import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';
import { IPostRepository } from '@/modules/posts/domain/posts/repositories/post.repository.interface';
import { ICommentRepository } from '@/modules/comments';
import { CommentId } from '@/modules/comments';
import { IUserRepository } from '@/modules/users/domain/users/repositories/user.repository.interface';
import { UserId } from '@/modules/users/domain/users/value-objects/user-id.vo';
import { TargetResolverRegistry } from '@/modules/target-resolution/application/target-resolution/target-resolution.registry';
import {
  CommentCreatedJobPayload,
  LikeToggledJobPayload,
  UserFollowedJobPayload,
  PostModeratedJobPayload,
} from '@/modules/notifications/application/public-api';
import { EventNames } from '@/common/constants/event-names.constant';
import {
  LikeToggledJobSchema,
  CommentCreatedJobSchema,
  UserFollowedJobSchema,
  PostModeratedJobSchema,
} from '@/shared/queue/job-payload.schemas';

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
        case EventNames.LIKE_TOGGLED: {
          const parsed = LikeToggledJobSchema.safeParse(job.data);
          if (!parsed.success)
            throw new UnrecoverableError(
              `Invalid like.toggled payload: ${parsed.error.message}`,
            );
          await this.handleLikeEvent(parsed.data);
          break;
        }
        case EventNames.COMMENT_CREATED: {
          const parsed = CommentCreatedJobSchema.safeParse(job.data);
          if (!parsed.success)
            throw new UnrecoverableError(
              `Invalid comment.created payload: ${parsed.error.message}`,
            );
          await this.handleCommentEvent(parsed.data);
          break;
        }
        case 'user.followed': {
          const parsed = UserFollowedJobSchema.safeParse(job.data);
          if (!parsed.success)
            throw new UnrecoverableError(
              `Invalid user.followed payload: ${parsed.error.message}`,
            );
          await this.handleFollowEvent(parsed.data);
          break;
        }
        case 'post.moderated': {
          const parsed = PostModeratedJobSchema.safeParse(job.data);
          if (!parsed.success)
            throw new UnrecoverableError(
              `Invalid post.moderated payload: ${parsed.error.message}`,
            );
          await this.handlePostModeratedEvent(parsed.data);
          break;
        }
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id} of type ${job.name}`,
        error,
      );
      throw error;
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
