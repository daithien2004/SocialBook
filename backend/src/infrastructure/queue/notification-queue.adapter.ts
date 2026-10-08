import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INotificationQueuePort } from '@/modules/notifications/application/public-api';
import {
  CommentCreatedJobPayload,
  LikeToggledJobPayload,
  UserFollowedJobPayload,
  PostModeratedJobPayload,
} from '@/modules/notifications/application/public-api';
import { DEFAULT_JOB_OPTIONS } from '@/shared/queue/default-job-options';
import { EventNames } from '@/common/constants/event-names.constant';

@Injectable()
export class NotificationQueueAdapter implements INotificationQueuePort {
  private readonly logger = new Logger(NotificationQueueAdapter.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  async queueCommentCreated(payload: CommentCreatedJobPayload): Promise<void> {
    try {
      await this.notificationQueue.add(EventNames.COMMENT_CREATED, payload, {
        ...DEFAULT_JOB_OPTIONS,
        // jobId: comment cụ thể chỉ tạo 1 thông báo duy nhất dù retry bao nhiêu lần.
        jobId: `notify-comment-${payload.commentId}`,
      });
      this.logger.debug(
        `Queued comment.created job for user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error('Failed to queue comment.created job', error);
      throw error;
    }
  }

  async queueLikeToggled(payload: LikeToggledJobPayload): Promise<void> {
    try {
      await this.notificationQueue.add(EventNames.LIKE_TOGGLED, payload, {
        ...DEFAULT_JOB_OPTIONS,
        // jobId: mỗi lượt like/unlike trên cùng target chỉ gửi 1 thông báo.
        // Dùng timestamp để phân biệt nếu cùng user like lại sau khi đã unlike.
        jobId: `notify-like-${payload.userId}-${payload.targetId}-${Date.now()}`,
      });
      this.logger.debug(`Queued like.toggled job for user ${payload.userId}`);
    } catch (error) {
      this.logger.error('Failed to queue like.toggled job', error);
      throw error;
    }
  }

  async queueUserFollowed(payload: UserFollowedJobPayload): Promise<void> {
    try {
      await this.notificationQueue.add('user.followed', payload, {
        ...DEFAULT_JOB_OPTIONS,
        jobId: `notify-follow-${payload.userId}-${payload.targetId}`,
      });
      this.logger.debug(`Queued user.followed job for user ${payload.userId}`);
    } catch (error) {
      this.logger.error('Failed to queue user.followed job', error);
      throw error;
    }
  }

  async queuePostModerated(payload: PostModeratedJobPayload): Promise<void> {
    try {
      await this.notificationQueue.add('post.moderated', payload, {
        ...DEFAULT_JOB_OPTIONS,
        jobId: `notify-moderated-${payload.postId}`,
      });
      this.logger.debug(`Queued post.moderated job for user ${payload.userId}`);
    } catch (error) {
      this.logger.error('Failed to queue post.moderated job', error);
      throw error;
    }
  }
}
