import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Review,
  ReviewDocument,
} from '@/infrastructure/database/schemas/review.schema';
import {
  Book,
  BookDocument,
} from '@/infrastructure/database/schemas/book.schema';
import {
  User,
  UserDocument,
} from '@/infrastructure/database/schemas/user.schema';

interface ReviewSeedData {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  content: string;
  rating: number;
  likesCount: number;
  likedBy: Types.ObjectId[];
  verifiedPurchase: boolean;
  moderationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReviewsSeed {
  private readonly logger = new Logger(ReviewsSeed.name);

  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    this.logger.log('⭐ Seeding reviews...');

    const existingCount = await this.reviewModel.countDocuments();
    if (existingCount > 0) {
      this.logger.warn(
        `⚠️ Found ${existingCount} existing reviews. Skipping...`,
      );
      return;
    }

    const users = await this.userModel.find();
    const books = await this.bookModel.find();

    if (users.length === 0 || books.length === 0) {
      this.logger.error('❌ Users or books not found.');
      return;
    }

    const reviewTemplates = [
      {
        rating: 5,
        content:
          'Một kiệt tác thực sự! Nội dung sâu sắc và lôi cuốn đến từng trang.',
      },
      {
        rating: 4,
        content:
          'Rất đáng đọc. Cốt truyện hấp dẫn, nhân vật được xây dựng tốt.',
      },
      {
        rating: 4,
        content:
          'Tác giả viết rất tinh tế, nhiều tầng ý nghĩa. Sẽ đọc lại lần nữa.',
      },
      {
        rating: 3,
        content: 'Khá ổn, nhưng có vài đoạn hơi chậm. Tổng thể vẫn OK.',
      },
      {
        rating: 5,
        content:
          'Không thể rời mắt khỏi trang sách! Một trong những cuốn hay nhất tôi từng đọc.',
      },
      {
        rating: 4,
        content:
          'Ngôn từ đẹp, cảm xúc chân thật. Rất recommend cho ai yêu văn học.',
      },
      {
        rating: 3,
        content:
          'Đọc được, nhưng không quá xuất sắc. Có vài tình tiết hơi khó tin.',
      },
      {
        rating: 5,
        content: 'Tuyệt vời! Câu chuyện chạm đến trái tim người đọc.',
      },
      {
        rating: 2,
        content:
          'Kỳ vọng hơi cao nên hơi thất vọng. Dù sao cũng có vài điểm sáng.',
      },
      {
        rating: 4,
        content: 'Một cuốn sách đáng để dành thời gian. Nhiều bài học quý giá.',
      },
    ];

    const reviews: ReviewSeedData[] = [];
    for (const book of books) {
      const numReviews = Math.min(
        Math.floor(Math.random() * 4) + 2,
        users.length,
      );
      const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numReviews; i++) {
        const template =
          reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
        reviews.push({
          userId: shuffledUsers[i]._id,
          bookId: book._id,
          content: template.content,
          rating: template.rating,
          likesCount: Math.floor(Math.random() * 50),
          likedBy: [],
          verifiedPurchase: Math.random() > 0.3,
          moderationStatus: 'approved',
          createdAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ),
          updatedAt: new Date(),
        });
      }
    }

    await this.reviewModel.insertMany(reviews);
    this.logger.log(`✅ Seeded ${reviews.length} reviews`);
  }
}
