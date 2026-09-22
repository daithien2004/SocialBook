import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INotificationQueuePort } from '@/application/ports/notification-queue.port';
import {
  CommentCreatedJobPayload,
  LikeToggledJobPayload,
  UserFollowedJobPayload,
  PostModeratedJobPayload,
} from '@/application/notifications/jobs/notification-job.payload';

@Injectable()
export class NotificationQueueAdapter implements INotificationQueuePort {
  private readonly logger = new Logger(NotificationQueueAdapter.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  async queueCommentCreated(payload: CommentCreatedJobPayload): Promise<void> {
    try {
      await this.notificationQueue.add('comment.created', payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 100, // keep last 100 failed jobs for debugging
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
      await this.notificationQueue.add('like.toggled', payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
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
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
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
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      });
      this.logger.debug(`Queued post.moderated job for user ${payload.userId}`);
    } catch (error) {
      this.logger.error('Failed to queue post.moderated job', error);
      throw error;
    }
  }
}
