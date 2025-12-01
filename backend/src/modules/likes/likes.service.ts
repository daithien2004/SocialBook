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

@Injectable()
export class LikesService {
  constructor(@InjectModel(Like.name) private readonly likeModel: Model<LikeDocument>,
              @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
              @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
              private readonly notifications: NotificationsService,) {}

  async getCount(dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;

    if (!Types.ObjectId.isValid(targetId)) return { count: 0 };

    const count = await this.likeModel.countDocuments({
      targetType: targetType.toLowerCase(),
      targetId: new Types.ObjectId(targetId),
    });

    return { count };
  }

  async checkStatus(userId: string, dto: ToggleLikeDto) {
    const { targetId, targetType } = dto;
    if (!Types.ObjectId.isValid(targetId)) return { isLiked: false };

    const exists = await this.likeModel.exists({
      userId: new Types.ObjectId(userId),
      targetType: targetType.toLowerCase(),
      targetId: new Types.ObjectId(targetId),
    });

    return { isLiked: !!exists };
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
      targetType: normalizedType, // 'post' | 'chapter' | 'comment' | 'paragraph'
      targetId: new Types.ObjectId(targetId),
    };

    const existing = await this.likeModel.exists(filter);

    if (existing) {
      // Đã like rồi -> toggle thành unlike
      await this.likeModel.deleteOne(filter);
      return { isLiked: false };
    }

    // Chưa like -> tạo like mới
    await this.likeModel.create({
      ...filter,
      createdAt: new Date(),
    });

    // 🎯 Sau khi like thành công, gửi notification (nếu cần)
    await this.createLikeNotification(userId, normalizedType, targetId);

    return { isLiked: true };
  }

  /**
   * Gửi notification khi userId like một target nào đó
   */
  // likes.service.ts
  private async createLikeNotification(
    actorId: string,
    targetType: CommentTargetType,
    targetId: string,
  ) {
    let ownerId: string | null = null;
    let title = 'Ai đó đã thích nội dung của bạn';
    let message = 'Bạn có một lượt thích mới.';
    if (targetType === 'post') {
      const post = await this.postModel
        .findById(targetId)
        .select('_id userId title content')   // ✔ chỉ dùng userId, không còn authorId
        .lean();
      if (!post) return;

      ownerId = post.userId.toString();       // ✔ đổi hoàn toàn sang userId
      title = 'Ai đó đã thích bài viết của bạn';
      message = `Bài viết "${post.content}" vừa nhận được một lượt thích.`;

    } else if (targetType === 'comment') {

      const comment = await this.commentModel
        .findById(targetId)
        .select('id userId content postId')  // ✔ comment cũng dùng userId
        .lean();
      if (!comment) return;

      ownerId = comment.userId.toString();    // ✔ đổi sang userId
      title = 'Ai đó đã thích bình luận của bạn';
      message = `Bình luận "${comment.content}" vừa được thích.`;

    } else {
      // Những loại khác như chapter, paragraph nếu sau này bạn cần
      return;
    }

    // ❗ Không gửi thông báo nếu tự like chính mình
    if (!ownerId || ownerId === actorId) {
      return;
    }
    await this.notifications.create({
      userId: ownerId, // người nhận thông báo
      title,
      message,
      type: 'like',
      meta: {
        targetType,
        targetId,
        actorId, // ai là người like
      },
    });
  }
}
