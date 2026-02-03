import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';

import { CommentsRepository } from '../../data-access/repositories/comments.repository';
import { CommentTargetType, TARGET_TYPES } from './constants/targetType.constant';
import { CommentDocument } from './schemas/comment.schema';

import { LikesService } from '@/src/modules/likes/likes.service';

import { CommentCountDto } from '@/src/modules/comments/dto/create-comment.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

import { ErrorMessages } from '@/src/common/constants/error-messages';
import { NotificationsService } from '@/src/modules/notifications/notifications.service';
import { CacheService } from '@/src/shared/cache/cache.service';
import { BooksRepository } from '../../data-access/repositories/books.repository';
import { ChaptersRepository } from '../../data-access/repositories/chapters.repository';
import { ContentModerationService } from '../content-moderation/content-moderation.service';
import { PostsRepository } from '@/src/data-access/repositories/posts.repository';
import { UsersRepository } from '@/src/data-access/repositories/users.repository';
import { CommentModal } from './modals/comment.modal';

@Injectable()
export class CommentsService {
  constructor(
    private readonly likesService: LikesService,
    private readonly commentsRepository: CommentsRepository,
    private readonly contentModerationService: ContentModerationService,
    private readonly postsRepository: PostsRepository,
    private readonly chaptersRepository: ChaptersRepository,
    private readonly booksRepository: BooksRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notifications: NotificationsService,
    private readonly cacheService: CacheService,
  ) { }

  async findByTarget(
    targetId: string,
    parentId: string | null,
    cursor?: string,
    limit: number = 10,
    userId?: string,
  ) {
    if (!targetId) throw new BadRequestException('Target ID is required');

    const canCache = !cursor;
    const cacheKey = `comments:target:${targetId}:parent:${parentId || 'root'}:firstpage`;

    if (canCache) {
      const cached = await this.cacheService.get<Record<string, unknown>>(cacheKey);
      if (cached) return cached;
    }

    const filter: FilterQuery<CommentDocument> = {
      targetId: new Types.ObjectId(targetId),
      parentId: parentId ? new Types.ObjectId(parentId) : null,
      isDelete: false,
    };

    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const commentsRaw = await this.commentsRepository.findByTargetRaw(filter, limit);

    const hasMore = commentsRaw.length > limit;
    const comments = hasMore ? commentsRaw.slice(0, limit) : commentsRaw;
    const commentIds = comments.map((c) => c._id);

    const [repliesGroup] = await Promise.all([
      this.aggregateReplyCounts(commentIds),
      this.likesService.aggregateLikeCounts(commentIds, 'comment'),
      userId
        ? this.likesService.getLikedTargets(userId, commentIds, 'comment')
        : Promise.resolve(new Set<string>()),
    ]);

    const replyMap = this.createCountMap(repliesGroup);

    const items = CommentModal.fromArray(comments).map((c, idx) => ({
      ...c,
      repliesCount: replyMap[comments[idx]._id.toString()] || 0,
    }));

    const result = {
      items,
      meta: {
        nextCursor: hasMore
          ? comments[comments.length - 1]._id.toString()
          : null,
        hasMore,
        limit,
      },
    };

    if (canCache) {
      await this.cacheService.set(cacheKey, result, 900); // 15 minutes
    }

    return result;
  }

  async resolveParentId(
    targetId: Types.ObjectId,
    targetType: string,
    parentId?: string | null,
  ) {
    if (!parentId) return { parentId: null, level: 1 };

    const parent = await this.commentsRepository.findByIdSelected(parentId, '_id targetId targetType parentId');

    if (!parent) throw new NotFoundException(ErrorMessages.PARENT_COMMENT_NOT_FOUND);

    if (parent.targetId.toString() !== targetId.toString()) {
      throw new ForbiddenException(
        'Parent comment does not belong to this target',
      );
    }
    if (parent.targetType !== targetType) {
      throw new ForbiddenException('Parent comment target type mismatch');
    }

    if (!parent.parentId) {
      return { parentId: parent._id, level: 2 };
    }

    const grandParent = await this.commentsRepository.findByIdSelected(parent.parentId, '_id parentId');

    if (!grandParent || !grandParent.parentId) {
      return { parentId: parent._id, level: 2 };
    }

    return { parentId: grandParent._id, level: 3 };
  }

  async create(userId: string, dto: CreateCommentDto) {
    const { targetType, targetId, content, parentId } = dto;

    if (!Object.values(TARGET_TYPES).includes(targetType as CommentTargetType)) {
      throw new BadRequestException('Invalid target type');
    }
    if (!content?.trim()) throw new BadRequestException('Content is required');
    if (!Types.ObjectId.isValid(targetId))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const moderationResult = await this.contentModerationService.checkContent(content);

    if (!moderationResult.isSafe) {
      const reason = moderationResult.reason ||
        (moderationResult.isSpoiler ? 'Nội dung chứa thông tin spoiler' :
          moderationResult.isToxic ? 'Nội dung độc hại hoặc không phù hợp' :
            'Nội dung không phù hợp');

      throw new BadRequestException(
        `Bình luận của bạn đã bị từ chối: ${reason}. Đảm bảo bình luận của bạn tuân theo các quy tắc cộng đồng.`
      );
    }

    const userObjectId = new Types.ObjectId(userId);
    const targetObjectId = new Types.ObjectId(targetId);

    const { parentId: finalParentId } = await this.resolveParentId(
      targetObjectId,
      targetType,
      parentId,
    );

    const newComment = await this.commentsRepository.createComment({
      userId: userObjectId,
      targetType,
      targetId: targetObjectId,
      parentId: finalParentId,
      content: content.trim(),
    });

    if (!newComment) {
      throw new InternalServerErrorException('Failed to create comment');
    }

    try {
      await this.createCommentNotification(
        userId,
        targetType,
        targetId,
        finalParentId ? finalParentId.toString() : null,
        content.trim(),
        newComment._id.toString(),
      );
    } catch (e) {
      console.log('createCommentNotification failed', e);
    }

    const cacheKey = `comments:target:${targetId}:parent:${finalParentId || 'root'}:firstpage`;
    await this.cacheService.del(cacheKey);

    return new CommentModal(newComment);
  }

  private async aggregateReplyCounts(parentIds: Types.ObjectId[]) {
    if (parentIds.length === 0) return [];
    return this.commentsRepository.aggregateReplyCounts(parentIds);
  }

  private createCountMap(groupData: { _id: Types.ObjectId; count: number }[]): Record<string, number> {
    return groupData.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getCommentCount(dto: CommentCountDto) {
    if (!Types.ObjectId.isValid(dto.targetId)) {
      return { count: 0 };
    }

    const count = await this.commentsRepository.countByTarget(dto.targetId, dto.targetType);

    return { count };
  }

  private async createCommentNotification(
    actorId: string,
    targetType: string,
    targetId: string,
    parentId: string | null,
    commentContent: string,
    commentId?: string,
  ) {
    let ownerId: string | null = null;
    let title = 'Ai đó đã bình luận nội dung của bạn';
    let message = `Bạn có một bình luận mới: "${commentContent}"`;
    let actionUrl = '';

    const actor = await this.usersRepository.findById(actorId, '_id username image');

    if (!actor) return;

    if (parentId) {
      const parent = await this.commentsRepository.findByIdSelected(parentId, 'userId targetId targetType');

      if (!parent) return;

      ownerId = parent.userId ? parent.userId.toString() : null;
      title = `${actor.username} đã trả lời bình luận của bạn`;
      message = `Bình luận của bạn vừa có phản hồi: "${commentContent}"`;

      actionUrl =
        (await this.resolveActionUrl(
          parent.targetType,
          parent.targetId.toString(),
        )) ?? '';
    }

    else {
      if (targetType === 'post') {
        const post = await this.postsRepository.findById(targetId, '_id userId content');
        if (!post) return;

        ownerId = post.userId?.toString();
        title = `${actor.username} đã bình luận bài viết của bạn`;
        message = `Bài viết "${post.content}" vừa có bình luận: "${commentContent}"`;
        actionUrl = `/posts/${post._id}`;

      } else {
        return;
      }
    }

    if (!ownerId || ownerId === actorId) return;
    await this.notifications.create({
      userId: ownerId as string,
      title,
      message,
      type: parentId ? 'reply' : 'comment',
      actionUrl,
      meta: {
        actorId: actor._id.toString(),
        username: actor.username,
        image: actor.image,
        targetId,
      },
    });
  }

  private async resolveActionUrl(
    targetType: string,
    targetId: string,
  ): Promise<string | null> {

    if (targetType === 'post') {
      return `/posts/${targetId}`;
    }

    if (targetType === 'chapter') {
      const chapter = await this.chaptersRepository.findById(targetId, 'bookId slug');
      if (!chapter) return null;

      const book = await this.booksRepository.findById(chapter.bookId, 'slug');
      if (!book) return null;

      return `/books/${book.slug}/chapters/${chapter.slug}`;
    }

    if (targetType === 'paragraph') {
      const chapter = await this.chaptersRepository.findOne(
        { 'paragraphs._id': new Types.ObjectId(targetId) },
        'bookId slug'
      );

      if (!chapter) return null;

      const book = await this.booksRepository.findById(chapter.bookId, 'slug');

      if (!book) return null;

      return `/books/${book.slug}/chapters/${chapter.slug}`;
    }

    return null;
  }

  async updateComment(
    userId: string,
    commentId: string,
    content: string,
  ) {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) throw new NotFoundException(ErrorMessages.COMMENT_NOT_FOUND);

    if (comment.isDelete) {
      throw new BadRequestException('Bình luận đã được xóa');
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException(ErrorMessages.COMMENT_UPDATE_FORBIDDEN);
    }

    const moderationResult =
      await this.contentModerationService.checkContent(content);

    if (!moderationResult.isSafe) {
      throw new BadRequestException('bình luận không hợp lệ');
    }

    // Invalidate Cache
    const parentId = comment.parentId ? comment.parentId.toString() : 'root';
    const cacheKey = `comments:target:${comment.targetId}:parent:${parentId}:firstpage`;
    await this.cacheService.del(cacheKey);

    const updated = await this.commentsRepository.update(comment._id, {
      content: content.trim(),
      updatedAt: new Date()
    }, 'Bình luận không tồn tại');
    return new CommentModal(updated);
  }

  async deleteComment(userId: string, commentId: string) {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) throw new NotFoundException(ErrorMessages.COMMENT_NOT_FOUND);

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException(ErrorMessages.COMMENT_DELETE_FORBIDDEN);
    }

    if (comment.isDelete) return;

    // Invalidate Cache
    const parentId = comment.parentId ? comment.parentId.toString() : 'root';
    const cacheKey = `comments:target:${comment.targetId}:parent:${parentId}:firstpage`;
    await this.cacheService.del(cacheKey);

    await this.commentsRepository.softDelete(comment._id);
  }

  async countByParentId(parentId: string) {
    if (!Types.ObjectId.isValid(parentId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const count = await this.commentsRepository.countByParentId(parentId);

    return count;
  }
}
