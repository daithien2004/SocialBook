import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { Comment, CommentDocument } from './schemas/comment.schema';
import { TARGET_TYPES } from './constants/targetType.constant';

import { LikesService } from '@/src/modules/likes/likes.service';

import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentCountDto } from '@/src/modules/comments/dto/create-comment.dto';

import { ContentModerationService } from '../content-moderation/content-moderation.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly likesService: LikesService,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private readonly contentModerationService: ContentModerationService,
  ) { }

  async findByTarget(
    targetId: string,
    parentId: string | null,
    cursor?: string,
    limit: number = 10,
    userId?: string,
  ) {
    if (!targetId) throw new BadRequestException('Target ID is required');

    const filter: FilterQuery<CommentDocument> = {
      targetId: new Types.ObjectId(targetId),
      parentId: parentId ? new Types.ObjectId(parentId) : null,
    };

    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const commentsRaw = await this.commentModel
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('userId', 'username image')
      .lean();

    const hasMore = commentsRaw.length > limit;
    const comments = hasMore ? commentsRaw.slice(0, limit) : commentsRaw;
    const commentIds = comments.map((c) => c._id);

    const [repliesGroup, likesGroup, likedTargets] = await Promise.all([
      this.aggregateReplyCounts(commentIds),
      this.likesService.aggregateLikeCounts(commentIds, 'comment'),
      userId
        ? this.likesService.getLikedTargets(userId, commentIds, 'comment')
        : Promise.resolve(new Set<string>()),
    ]);

    const replyMap = this.createCountMap(repliesGroup);
    const likeMap = this.createCountMap(likesGroup);

    const items = comments.map((c) => ({
      ...c,
      repliesCount: replyMap[c._id.toString()] || 0,
      likesCount: likeMap[c._id.toString()] || 0,
      isLiked: likedTargets.has(c._id.toString()),
    }));

    return {
      items,
      meta: {
        nextCursor: hasMore
          ? comments[comments.length - 1]._id.toString()
          : null,
        hasMore,
        limit,
      },
    };
  }

  async resolveParentId(
    targetId: Types.ObjectId,
    targetType: string,
    parentId?: string | null,
  ) {
    if (!parentId) return { parentId: null, level: 1 };

    const parent = await this.commentModel
      .findById(parentId)
      .select('_id targetId targetType parentId')
      .lean() as any;

    if (!parent) throw new NotFoundException('Parent comment not found');

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

    const grandParent = await this.commentModel
      .findById(parent.parentId)
      .select('_id parentId')
      .lean();

    if (!grandParent || !grandParent.parentId) {
      return { parentId: parent._id, level: 2 };
    }

    return { parentId: grandParent._id, level: 3 };
  }

  async create(userId: string, dto: CreateCommentDto) {
    const { targetType, targetId, content, parentId } = dto;

    // 1. Validation
    if (!Object.values(TARGET_TYPES).includes(targetType as any)) {
      throw new BadRequestException('Invalid target type');
    }
    if (!content?.trim()) throw new BadRequestException('Content is required');
    if (!Types.ObjectId.isValid(targetId))
      throw new BadRequestException('Invalid Target ID');

    // 2. Content Moderation
    const moderationResult = await this.contentModerationService.checkContent(content);

    // Reject toxic/unsafe content immediately
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

    const newComment = await this.commentModel.create({
      userId: userObjectId,
      targetType,
      targetId: targetObjectId,
      parentId: finalParentId,
      content: content.trim(),
    });

    return await this.commentModel
      .findById(newComment._id)
      .populate('userId', 'username image')
      .lean();
  }

  private async aggregateReplyCounts(parentIds: Types.ObjectId[]) {
    if (parentIds.length === 0) return [];
    return this.commentModel.aggregate([
      { $match: { parentId: { $in: parentIds } } },
      { $group: { _id: '$parentId', count: { $sum: 1 } } },
    ]);
  }

  private createCountMap(groupData: any[]): Record<string, number> {
    return groupData.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});
  }

  async getCommentCount(dto: CommentCountDto) {
    if (!Types.ObjectId.isValid(dto.targetId)) {
      return { count: 0 };
    }

    const count = await this.commentModel.countDocuments({
      targetId: new Types.ObjectId(dto.targetId),
      targetType: dto.targetType.toLowerCase(),
    });

    return { count };
  }

}
