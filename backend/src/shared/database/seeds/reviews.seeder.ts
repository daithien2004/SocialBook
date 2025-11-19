import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Review,
  ReviewDocument,
} from '@/src/modules/reviews/schemas/review.schema';
import { User, UserDocument } from '@/src/modules/users/schemas/user.schema';
import { Book, BookDocument } from '@/src/modules/books/schemas/book.schema';

@Injectable()
export class ReviewsSeed {
  private readonly logger = new Logger(ReviewsSeed.name);

  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async run() {
    try {
      this.logger.log('🌱 Seeding reviews...');

      const existingReviews = await this.reviewModel.countDocuments();
      if (existingReviews > 0) {
        this.logger.log('⏭️  Reviews already exist, skipping...');
        return;
      }

      const users = await this.userModel.find();
      const books = await this.bookModel.find();

      if (users.length === 0 || books.length === 0) {
        this.logger.error(
          '❌ Users or Books not found. Please seed them first.',
        );
        return;
      }

      const reviews = [
        {
          userId: users[1]._id,
          bookId: books[0]._id,
          content:
            'An absolutely magical start to an incredible series! The world-building is phenomenal and the characters are unforgettable. A must-read for all ages.',
          rating: 5,
          likesCount: 245,
          verifiedPurchase: true,
        },
        {
          userId: users[2]._id,
          bookId: books[0]._id,
          content:
            'Great book for young readers. The story is engaging and teaches valuable lessons about friendship and courage.',
          rating: 4,
          likesCount: 128,
          verifiedPurchase: true,
        },
        {
          userId: users[3]._id,
          bookId: books[1]._id,
          content:
            'Epic in every sense of the word. The political intrigue and complex characters make this a masterpiece of fantasy literature.',
          rating: 5,
          likesCount: 567,
          verifiedPurchase: false,
        },
        {
          userId: users[1]._id,
          bookId: books[1]._id,
          content:
            'Brilliant storytelling but can be slow at times. The payoff is worth it though. Highly recommended for fantasy fans.',
          rating: 4,
          likesCount: 234,
          verifiedPurchase: true,
        },
        {
          userId: users[4]._id,
          bookId: books[2]._id,
          content:
            'Terrifying and brilliant. Stephen King at his finest. I could not put this book down even though it gave me nightmares!',
          rating: 5,
          likesCount: 432,
          verifiedPurchase: true,
        },
        {
          userId: users[2]._id,
          bookId: books[2]._id,
          content:
            'A psychological horror masterpiece. The atmosphere is incredibly tense and the characters feel real.',
          rating: 5,
          likesCount: 298,
          verifiedPurchase: true,
        },
        {
          userId: users[3]._id,
          bookId: books[3]._id,
          content:
            'Classic mystery at its best. Agatha Christie never disappoints. The twist at the end is absolutely genius!',
          rating: 5,
          likesCount: 189,
          verifiedPurchase: false,
        },
        {
          userId: users[1]._id,
          bookId: books[4]._id,
          content:
            'The ultimate fantasy epic. Tolkiens world-building sets the standard for all fantasy literature that followed.',
          rating: 5,
          likesCount: 789,
          verifiedPurchase: true,
        },
        {
          userId: users[4]._id,
          bookId: books[4]._id,
          content:
            'A timeless classic that every fantasy fan must read. The depth and detail are unmatched.',
          rating: 5,
          likesCount: 654,
          verifiedPurchase: true,
        },
        {
          userId: users[2]._id,
          bookId: books[5]._id,
          content:
            'Page-turner from start to finish! Dan Brown knows how to keep you hooked. Perfect blend of history and thriller.',
          rating: 4,
          likesCount: 345,
          verifiedPurchase: true,
        },
        {
          userId: users[3]._id,
          bookId: books[5]._id,
          content:
            'Entertaining and fast-paced. Some historical inaccuracies but still a fun read.',
          rating: 3,
          likesCount: 87,
          verifiedPurchase: false,
        },
        {
          userId: users[4]._id,
          bookId: books[6]._id,
          content:
            'Surreal and beautiful. Murakamis writing transports you to another world. Not for everyone, but I loved it.',
          rating: 5,
          likesCount: 267,
          verifiedPurchase: true,
        },
        {
          userId: users[1]._id,
          bookId: books[7]._id,
          content:
            'Another horror masterpiece from King. The character development is outstanding and the scares are real.',
          rating: 5,
          likesCount: 523,
          verifiedPurchase: true,
        },
        {
          userId: users[2]._id,
          bookId: books[7]._id,
          content:
            'Long but worth every page. The friendship between the characters is the heart of this terrifying story.',
          rating: 4,
          likesCount: 412,
          verifiedPurchase: true,
        },
      ];

      await this.reviewModel.insertMany(reviews);
      this.logger.log(`✅ Successfully seeded ${reviews.length} reviews`);
    } catch (error) {
      this.logger.error('❌ Error seeding reviews:', error);
      throw error;
    }
  }
}
