import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Comment,
  CommentDocument,
} from '@/src/modules/comments/schemas/comment.schema';
import { TARGET_TYPES } from '@/src/modules/comments/constants/targetType.constant';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {
  }

  async countByTarget(targetId: string): Promise<number> {
    const targetObjectId = new Types.ObjectId(targetId);
    return this.commentModel.countDocuments({
      targetId: targetObjectId,
    });
  }

  async getCommentByTarget(
    targetId: string,
    parentId: string | null,
    cursor?: string,
    limit: number = 10,
  ) {
    if (!targetId) {
      throw new BadRequestException('targetId is required');
    }

    const targetObjectId = new Types.ObjectId(targetId);

    const filter: any = {
      targetId: targetObjectId,
    };

    if (parentId === null) {
      filter.parentId = null;
    } else if (parentId) {
      filter.parentId = new Types.ObjectId(parentId);
    }
    // Nếu có cursor → lấy comment cũ hơn nó
    if (cursor) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const itemsRaw = await this.commentModel
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate({
        path: 'userId',
        select: 'username image',
      })
      .lean();

    const hasMore = itemsRaw.length > limit;
    const itemsCut = hasMore ? itemsRaw.slice(0, limit) : itemsRaw;

    const parentIds = itemsCut.map((c) => c._id);

    const repliesGroup = await this.commentModel.aggregate([
      { $match: { parentId: { $in: parentIds } } },
      { $group: { _id: '$parentId', count: { $sum: 1 } } },
    ]);

    const replyCountMap = repliesGroup.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const items = itemsCut.map((c: any) => ({
      id: c._id.toString(),
      content: c.content,
      likesCount: c.likesCount,
      createdAt: c.createdAt,
      repliesCount: replyCountMap[c._id.toString()] ?? 0,
      user: c.userId
        ? {
          id: c.userId._id.toString(),
          username: c.userId.username,
          image: c.userId.image ?? null,
        }
        : null,
    }));

    return {
      items,
      nextCursor: hasMore ? itemsCut[itemsCut.length - 1]._id.toString() : null,
      hasMore,
    };
  }

  async createForTarget(userId: string, dto: CreateCommentDto) {
    const { targetType, targetId, content, parentId } = dto;

    if (!targetType || !Object.values(TARGET_TYPES).includes(targetType as any)) {
      throw new BadRequestException('targetType không hợp lệ');
    }
    if (!targetId) throw new BadRequestException('targetId là bắt buộc');
    if (!content?.trim()) throw new BadRequestException('content là bắt buộc');

    const targetObjectId = new Types.ObjectId(targetId);
    const userObjectId = new Types.ObjectId(userId);

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

    return newComment.toObject();
  }

  async resolveParentId(
    targetObjectId: Types.ObjectId,
    targetType: string,
    parentId?: string | null,
  ) {
    if (!parentId) return { parentId: null, level: 1 };

    const parent = await this.commentModel
      .findById(parentId)
      .select('_id targetId targetType parentId')
      .lean();

    if (!parent) {
      throw new NotFoundException('Parent comment không tồn tại');
    }
    if (String(parent.targetId) !== String(targetObjectId)) {
      throw new ForbiddenException('Parent không cùng targetId');
    }
    if (String(parent.targetType) !== String(targetType)) {
      throw new ForbiddenException('Parent không cùng targetType');
    }
    if (!parent.parentId) {
      return {
        parentId: new Types.ObjectId(parent._id),
        level: 1,
      };
    }
    const grandParent = await this.commentModel
      .findById(parent.parentId)
      .select('_id parentId')
      .lean();

    if (!grandParent) {
      return {
        parentId: new Types.ObjectId(parent._id),
        level: 2,
      };
    }
    if (!grandParent.parentId) {
      return {
        parentId: new Types.ObjectId(parent._id),
        level: 2,
      };
    }
    return {
      parentId: new Types.ObjectId(grandParent._id),
      level: 3,
    };
  }
}
