import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Schemas
import { Like, LikeDocument } from './schemas/like.schema';

// DTOs
import { ToggleLikeDto } from './dto/create-like.dto';
import { NotificationsService } from '@/src/modules/notifications/notifications.service';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { CommentTargetType } from '@/src/modules/comments/constants/targetType.constant';
import { Comment, CommentDocument } from '@/src/modules/comments/schemas/comment.schema';
import { User, UserDocument } from '@/src/modules/users/schemas/user.schema';

@Injectable()
export class LikesService {
  constructor(@InjectModel(Like.name) private readonly likeModel: Model<LikeDocument>,
              @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
              @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
              @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
              private readonly notifications: NotificationsService,) {}

  async getCount(dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;

    if (!Types.ObjectId.isValid(targetId)) return { count: 0 };

    const count = await this.likeModel.countDocuments({
      targetType: targetType.toLowerCase(),
      targetId: new Types.ObjectId(targetId),
      status: true,
    });

    return { count };
  }

  async checkStatus(userId: string, dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;

    if (!Types.ObjectId.isValid(targetId) || !Types.ObjectId.isValid(userId)) {
      return { isLiked: false };
    }

    const normalizedType = targetType.toLowerCase();

    const like = await this.likeModel
      .findOne(
        {
          userId: new Types.ObjectId(userId),
          targetType: normalizedType,
          targetId: new Types.ObjectId(targetId),
        },
        { _id: 0, status: 1 }
      )
      .lean();

    return { isLiked: like?.status };
  }


  // Internal Helper (Used by Comments Service)
  async aggregateLikeCounts(targetIds: Types.ObjectId[], targetType: string) {
    if (!targetIds.length) return [];

    return this.likeModel.aggregate([
      { $match: { targetType, targetId: { $in: targetIds } } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
    ]);
  }

  async getLikedTargets(
    userId: string,
    targetIds: Types.ObjectId[],
    targetType: string,
  ): Promise<Set<string>> {
    if (!userId || targetIds.length === 0) return new Set();

    const likes = await this.likeModel
      .find({
        userId: new Types.ObjectId(userId),
        targetType,
        targetId: { $in: targetIds },
      })
      .select('targetId')
      .lean();

    return new Set(likes.map((like) => like.targetId.toString()));
  }

  async toggle(userId: string, dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;

    if (!Types.ObjectId.isValid(targetId)) {
      throw new BadRequestException('Invalid Target ID');
    }

    const normalizedType = targetType.toLowerCase() as CommentTargetType;

    const filter = {
      userId: new Types.ObjectId(userId),
      targetType: normalizedType,
      targetId: new Types.ObjectId(targetId),
    };

    // Tìm like hiện tại (nếu có)
    const existing = await this.likeModel.findOne(filter);

    if (!existing) {
      await this.likeModel.create({
        ...filter,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.createLikeNotification(userId, normalizedType, targetId);

      return { isLiked: true };
    }

    const updatedStatus = !existing.status;

    existing.status = updatedStatus;
    existing.updatedAt = new Date();
    await existing.save();
    return { isLiked: updatedStatus };
  }

  private async createLikeNotification(
    actorId: string,
    targetType: string,
    targetId: string,
  ) {
    let ownerId: string | null = null;
    let title = 'Ai đó đã thích nội dung của bạn';
    let message = 'Bạn có một lượt thích mới.';
    let actionUrl = '';

    // 🔹 Lấy thông tin người hành động
    const actor = await this.userModel
      .findById(actorId)
      .select('_id username image')
      .lean();

    if (!actor) return;

    if (targetType === 'post') {
      const post = await this.postModel
        .findById(targetId)
        .select('_id userId content')
        .lean();

      if (!post) return;

      ownerId = post.userId.toString();
      title = `${actor.username} đã thích bài viết của bạn`;
      message = `Bài viết "${post.content}" vừa nhận được một lượt thích.`;
      actionUrl = `/posts/${post._id}`;

    } else if (targetType === 'comment') {
      const comment = await this.commentModel
        .findById(targetId)
        .select('_id userId content targetId')
        .lean();

      if (!comment) return;

      ownerId = comment.userId.toString();
      title = `${actor.username} đã thích bình luận của bạn`;
      message = `Bình luận "${comment.content}" vừa được thích.`;
      actionUrl = `/posts/${comment.targetId}`;

    } else {
      return;
    }

    if (!ownerId || ownerId === actorId) {
      return;
    }

    await this.notifications.create({
      userId: ownerId,
      title,
      message,
      type: 'like',
      actionUrl,
      meta: {
        actorId: actor._id.toString(),
        username: actor.username,
        image: actor.image,
        targetId,
      },
    });
  }
}
