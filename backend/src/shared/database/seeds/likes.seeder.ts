import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Like,
  LikeDocument,
} from '@/infrastructure/database/schemas/like.schema';
import {
  Review,
  ReviewDocument,
} from '@/infrastructure/database/schemas/review.schema';
import {
  Comment,
  CommentDocument,
} from '@/infrastructure/database/schemas/comment.schema';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';

interface LikeSeedData {
  userId: Types.ObjectId;
  targetType: string;
  targetId: Types.ObjectId;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LikesSeed {
  private readonly logger = new Logger(LikesSeed.name);

  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('❤️ Seeding likes...');

    const existingCount = await this.likeModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(`⚠️ Found ${existingCount} existing likes. Skipping...`);
      return;
    }

    const users = await this.userModel.find();
    const reviews = await this.reviewModel.find();
    const comments = await this.commentModel.find().limit(50);

    if (users.length === 0) {
      this.logger.error('❌ Users not found.');
      return;
    }

    const likes: LikeSeedData[] = [];
    const pairs = new Set<string>();

    for (const review of reviews) {
      const numLikes = Math.floor(Math.random() * users.length) + 1;
      const shuffled = [...users].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numLikes, users.length); i++) {
        const pair = `review:${shuffled[i]._id.toString()}:${review._id.toString()}`;
        if (!pairs.has(pair)) {
          pairs.add(pair);
          likes.push({
            userId: shuffled[i]._id,
            targetType: 'review',
            targetId: review._id,
            status: true,
            createdAt: new Date(
              Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000,
            ),
            updatedAt: new Date(),
          });
          await this.reviewModel.updateOne(
            { _id: review._id },
            { $inc: { likesCount: 1 } },
          );
        }
      }
    }

    for (const comment of comments) {
      const numLikes = Math.floor(Math.random() * users.length) + 1;
      const shuffled = [...users].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numLikes, users.length); i++) {
        const pair = `comment:${shuffled[i]._id.toString()}:${comment._id.toString()}`;
        if (!pairs.has(pair)) {
          pairs.add(pair);
          likes.push({
            userId: shuffled[i]._id,
            targetType: 'comment',
            targetId: comment._id,
            status: true,
            createdAt: new Date(
              Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000,
            ),
            updatedAt: new Date(),
          });
        }
      }
    }

    if (likes.length > 0) {
      await this.likeModel.insertMany(likes);
    }

    this.logger.log(`✅ Seeded ${likes.length} likes`);
  }
}
