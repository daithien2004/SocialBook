import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '@/infrastructure/database/schemas/notification.schema';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';
import {
  Post,
  PostDocument,
} from '@/infrastructure/database/schemas/post.schema';
import {
  Comment,
  CommentDocument,
} from '@/infrastructure/database/schemas/comment.schema';

interface NotificationSeedData {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  sentAt: Date;
  meta?: {
    actorId?: Types.ObjectId;
    username?: string;
    image?: string;
    targetId?: Types.ObjectId;
  };
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NotificationSeed {
  private readonly logger = new Logger(NotificationSeed.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('🔔 Seeding notifications...');

    const existingCount = await this.notificationModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(
        `⚠️ Found ${existingCount} existing notifications. Skipping...`,
      );
      return;
    }

    const users = await this.userModel.find();
    const posts = await this.postModel.find().limit(20);
    const comments = await this.commentModel
      .find({ targetType: 'post' })
      .limit(30);

    if (users.length === 0) {
      this.logger.error('❌ Users not found.');
      return;
    }

    const notifications: NotificationSeedData[] = [];

    for (const user of users) {
      const others = users.filter(
        (u) => u._id.toString() !== user._id.toString(),
      );

      if (others.length === 0) continue;

      // 1. System welcome
      notifications.push({
        userId: user._id,
        title: 'Chào mừng đến với SocialBook!',
        message:
          'Cảm ơn bạn đã tham gia SocialBook. Hãy khám phá thư viện sách và kết nối với những người yêu sách nhé!',
        type: 'system',
        isRead: Math.random() > 0.5,
        sentAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        actionUrl: '/books',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });

      // 2. Follow notification
      const randomFollower = others[Math.floor(Math.random() * others.length)];
      notifications.push({
        userId: user._id,
        title: 'Theo dõi mới',
        message: `${randomFollower.username} đã theo dõi bạn.`,
        type: 'follow',
        isRead: Math.random() > 0.6,
        sentAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        meta: {
          actorId: randomFollower._id,
          username: randomFollower.username,
          image: randomFollower.image,
        },
        actionUrl: `/users/${randomFollower._id.toString()}`,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });

      // 3. Like notification — someone liked user's post
      const userPosts = posts.filter(
        (p) => p.userId && p.userId.toString() === user._id.toString(),
      );
      const likedPost =
        userPosts.length > 0
          ? userPosts[Math.floor(Math.random() * userPosts.length)]
          : posts[Math.floor(Math.random() * posts.length)];
      const randomLiker = others[Math.floor(Math.random() * others.length)];
      notifications.push({
        userId: user._id,
        title: 'Lượt thích mới',
        message: `${randomLiker.username} đã thích bài viết của bạn.`,
        type: 'like',
        isRead: Math.random() > 0.7,
        sentAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        meta: {
          actorId: randomLiker._id,
          username: randomLiker.username,
          image: randomLiker.image,
          targetId: likedPost._id,
        },
        actionUrl: `/posts/${likedPost._id.toString()}`,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });
    }

    // 4. Comment notifications — use real comments from DB
    if (comments.length > 0) {
      for (const comment of comments) {
        const commenter = users.find(
          (u) => u._id.toString() === comment.userId.toString(),
        );
        const post = posts.find(
          (p) => p._id.toString() === comment.targetId.toString(),
        );
        const recipient = users.find(
          (u) => post?.userId && u._id.toString() === post.userId.toString(),
        );

        if (!commenter || !recipient) continue;

        notifications.push({
          userId: recipient._id,
          title: 'Bình luận mới',
          message: `${commenter.username} đã bình luận bài viết của bạn.`,
          type: 'comment',
          isRead: Math.random() > 0.8,
          sentAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          ),
          meta: {
            actorId: commenter._id,
            username: commenter.username,
            image: commenter.image,
            targetId: comment._id,
          },
          actionUrl: `/posts/${comment.targetId.toString()}`,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        });
      }
    }

    await this.notificationModel.insertMany(notifications);
    this.logger.log(`✅ Seeded ${notifications.length} notification records`);
  }
}
