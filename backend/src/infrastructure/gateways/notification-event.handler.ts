import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '@/infrastructure/notifications/notifications.service';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';
import { CreateNotificationDto } from '@/application/notifications/dto/create-notification.dto';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';

@Injectable()
export class NotificationEventHandler {
  private readonly logger = new Logger(NotificationEventHandler.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly postRepository: IPostRepository,
    private readonly commentRepository: ICommentRepository,
    private readonly userRepository: IUserRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly bookRepository: IBookRepository,
  ) {}

  private async resolveActionUrl(
    targetType: string,
    targetId: string,
  ): Promise<string | undefined> {
    if (targetType === 'post') {
      return `/posts/${targetId}`;
    }

    if (targetType === 'chapter') {
      const chapter = await this.chapterRepository.findById(
        ChapterId.create(targetId),
      );
      if (chapter) {
        const book = await this.bookRepository.findById(
          BookId.create(chapter.bookId.toString()),
        );
        if (book) {
          return `/books/${book.slug}/chapters/${chapter.slug}`;
        }
        return `/chapters/${chapter.id.toString()}`;
      }
    }

    if (targetType === 'paragraph') {
      const chapter = await this.chapterRepository.findByParagraphId(targetId);
      if (chapter) {
        return this.resolveActionUrl('chapter', chapter.id.toString());
      }
    }

    if (targetType === 'comment') {
      const comment = await this.commentRepository.findById(
        CommentId.create(targetId),
      );
      if (comment) {
        return this.resolveActionUrl(
          comment.targetType.toString(),
          comment.targetId.toString(),
        );
      }
    }

    return undefined;
  }

  @OnEvent('like.toggled')
  async handleLikeEvent(payload: {
    userId: string;
    targetId: string;
    targetType: string;
    isLiked: boolean;
  }) {
    try {
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

        const notificationDto = new CreateNotificationDto(
          ownerId,
          title,
          message,
          'like',
          {
            actorId: payload.userId,
            username,
            image,
            targetId: payload.targetId,
          },
          actionUrl,
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

        const notificationDto = new CreateNotificationDto(
          ownerId,
          title,
          message,
          payload.parentId ? 'reply' : 'comment',
          {
            actorId: payload.userId,
            username,
            image,
            targetId: payload.targetId,
          },
          actionUrl,
        );
        await this.notificationsService.create(notificationDto);
      }
    } catch (error) {
      this.logger.error('Error handling comment notification event', error);
    }
  }

  @OnEvent('user.followed')
  async handleFollowEvent(payload: { userId: string; targetId: string }) {
    try {
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

        const notificationDto = new CreateNotificationDto(
          ownerId,
          title,
          message,
          'follow',
          {
            actorId: payload.userId,
            username,
            image,
            targetId: payload.targetId,
          },
          actionUrl,
        );
        await this.notificationsService.create(notificationDto);
      }
    } catch (error) {
      this.logger.error('Error handling follow notification event', error);
    }
  }
}
