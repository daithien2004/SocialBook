import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Like,
  LikeDocument,
} from '@/infrastructure/database/schemas/like.schema';
import {
  Book,
  BookDocument,
} from '@/infrastructure/database/schemas/book.schema';
import {
  Post,
  PostDocument,
} from '@/infrastructure/database/schemas/post.schema';
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
export class BookPostLikesSeed {
  private readonly logger = new Logger(BookPostLikesSeed.name);

  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('❤️ Seeding likes for books and posts...');

    const users = await this.userModel.find();
    if (users.length === 0) {
      this.logger.error('❌ Users not found.');
      return;
    }

    const books = await this.bookModel.find().exec();
    const posts = await this.postModel.find().exec();

    if (books.length === 0 && posts.length === 0) {
      this.logger.error('❌ No books or posts found.');
      return;
    }

    const deleted = await this.likeModel.deleteMany({
      targetType: { $in: ['book', 'post'] },
    });
    if (deleted.deletedCount > 0) {
      this.logger.log(`🗑️ Deleted ${deleted.deletedCount} old book/post likes`);
    }

    const likes: LikeSeedData[] = [];
    const pairs = new Set<string>();

    for (const book of books) {
      const numLikes =
        Math.floor(Math.random() * Math.min(users.length, 5)) + 1;
      const shuffled = [...users].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numLikes, users.length); i++) {
        const pair = `book:${shuffled[i]._id.toString()}:${book._id.toString()}`;
        if (!pairs.has(pair)) {
          pairs.add(pair);
          likes.push({
            userId: shuffled[i]._id,
            targetType: 'book',
            targetId: book._id,
            status: true,
            createdAt: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
            updatedAt: new Date(),
          });
        }
      }

      await this.bookModel.updateOne(
        { _id: book._id },
        { $set: { likes: numLikes } },
      );
    }

    for (const post of posts) {
      const numLikes =
        Math.floor(Math.random() * Math.min(users.length, 6)) + 1;
      const shuffled = [...users].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numLikes, users.length); i++) {
        const pair = `post:${shuffled[i]._id.toString()}:${post._id.toString()}`;
        if (!pairs.has(pair)) {
          pairs.add(pair);
          likes.push({
            userId: shuffled[i]._id,
            targetType: 'post',
            targetId: post._id,
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

    this.logger.log(
      `✅ Seeded ${likes.length} likes (${books.length} books × ${posts.length} posts)`,
    );
  }
}
