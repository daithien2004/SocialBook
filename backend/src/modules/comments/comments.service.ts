import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '@/src/modules/comments/schemas/comment.schema';

@Injectable()
export class CommentsService {

  constructor(@InjectModel(Comment.name) private commentModel: Model<CommentDocument>) {}

  create(createCommentDto: CreateCommentDto) {
    return 'This action adds a new comment';
  }

  findAll() {
    return `This action returns all comments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} comment`;
  }

  update(id: number, updateCommentDto: UpdateCommentDto) {
    return `This action updates a #${id} comment`;
  }

  remove(id: number) {
    return `This action removes a #${id} comment`;
  }

  async countByTarget(
    targetId: string,
  ): Promise<number> {
    const targetObjectId = new Types.ObjectId(targetId);
    return this.commentModel.countDocuments({
      targetId: targetObjectId,
    });
  }

  async getLevel1(
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
      .sort({ _id: -1 })       // Dựa theo id để phân trang
      .limit(limit + 1)        // Lấy thêm 1 để check còn dữ liệu không
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
      { $group: { _id: "$parentId", count: { $sum: 1 } } }
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
}
