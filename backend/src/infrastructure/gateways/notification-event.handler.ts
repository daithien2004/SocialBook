import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../external/notifications.service';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { CreateNotificationDto } from '@/application/notifications/dto/create-notification.dto';

@Injectable()
export class NotificationEventHandler {
  private readonly logger = new Logger(NotificationEventHandler.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly postRepository: IPostRepository,
    private readonly commentRepository: ICommentRepository,
  ) {}

  @OnEvent('like.toggled')
  async handleLikeEvent(payload: {
    userId: string;
    targetId: string;
    targetType: string;
    isLiked: boolean;
  }) {

    try {
      let ownerId: string | null = null;
      let title = 'Lượt thích mới';
      let message = 'Ai đó đã thích nội dung của bạn';

      if (payload.targetType === 'post') {
        const post = await this.postRepository.findById(payload.targetId);
        if (post) {
          ownerId = post.userId.toString();
          message = `Đã thích bài viết của bạn: "${post.content.substring(0, 30)}..."`;
        }
      } else if (payload.targetType === 'comment') {
        const comment = await this.commentRepository.findById(CommentId.create(payload.targetId));
        if (comment) {
          ownerId = comment.userId.toString();
          message = `Đã thích bình luận của bạn: "${comment.content.toString().substring(0, 30)}..."`;
        }
      }
     
      if (ownerId && ownerId !== payload.userId) {
        const notificationDto = new CreateNotificationDto(
          ownerId,
          title,
          message,
          'like',
          {
            actorId: payload.userId,
            username: 'Người dùng',
            image: '',
            targetId: payload.targetId,
          },
          payload.targetType === 'post' ? `/posts/${payload.targetId}` : undefined,
        );
        await this.notificationsService.create(notificationDto);
      }
    } catch (error) {
      this.logger.error('Error handling like notification event', error);
    }
  }

  @OnEvent('comment.created')
  async handleCommentEvent(payload: {
    commentId: string;
    userId: string;
    targetId: string;
    targetType: string;
    parentId?: string;
  }) {
    try {
      let ownerId: string | null = null;
      let title = 'Bình luận mới';
      let message = 'Ai đó đã bình luận về nội dung của bạn';

      if (payload.parentId) {
        const parentComment = await this.commentRepository.findById(CommentId.create(payload.parentId));
        if (parentComment) {
          ownerId = parentComment.userId.toString();
          title = 'Phản hồi bình luận';
          message = 'Đã trả lời bình luận của bạn';
        }
      } else if (payload.targetType === 'post') {
        const post = await this.postRepository.findById(payload.targetId);
        if (post) {
          ownerId = post.userId.toString();
          message = 'Đã bình luận về bài viết của bạn';
        }
      }

      if (ownerId && ownerId !== payload.userId) {
        const notificationDto = new CreateNotificationDto(
          ownerId,
          title,
          message,
          payload.parentId ? 'reply' : 'comment',
          {
            actorId: payload.userId,
            username: 'Người dùng',
            image: '',
            targetId: payload.targetId,
          },
          payload.targetType === 'post' ? `/posts/${payload.targetId}` : undefined,
        );
        await this.notificationsService.create(notificationDto);
      }
    } catch (error) {
      this.logger.error('Error handling comment notification event', error);
    }
  }
}
