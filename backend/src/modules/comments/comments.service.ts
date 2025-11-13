import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PostDocument } from '@/src/modules/posts/schemas/post.schema';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '@/src/modules/comments/schemas/comment.schema';
import { COMMENT_TARGET_TYPES, CommentTargetType } from '@/src/modules/comments/constants/comment.constant';

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
    targetType: CommentTargetType,
    page: number = 1,
    limit: number = 20,
  ) {
    if (!targetId) {
      throw new BadRequestException('targetId is required');
    }

    if (!COMMENT_TARGET_TYPES.includes(targetType)) {
      throw new BadRequestException('Invalid targetType');
    }

    const targetObjectId = new Types.ObjectId(targetId);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.commentModel
        .find({
          targetType,
          targetId: targetObjectId,
          parentId: null,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username'),
      this.commentModel.countDocuments({
        targetType,
        targetId: targetObjectId,
        parentId: null,
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
