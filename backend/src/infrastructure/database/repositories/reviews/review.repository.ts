import { Review as ReviewEntity } from '@/domain/reviews/entities/review.entity';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { ReviewMapper } from '@/infrastructure/database/repositories/reviews/review.mapper';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../../schemas/review.schema';

@Injectable()
export class ReviewRepository implements IReviewRepository {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async create(review: ReviewEntity): Promise<ReviewEntity> {
    const persistenceModel = ReviewMapper.toPersistence(review);
    const createdReview = await this.reviewModel.create(persistenceModel);
    // Populate immediately to return full entity
    const populated = await createdReview.populate('userId', 'username image');
    return ReviewMapper.toDomain(populated);
  }

  async update(review: ReviewEntity): Promise<ReviewEntity> {
    const persistenceModel = ReviewMapper.toPersistence(review);
    // We only update specific fields, avoiding overwriting immutable ones if needed
    const updated = await this.reviewModel
      .findByIdAndUpdate(
        review.id,
        {
          content: review.content,
          rating: review.rating,
          moderationStatus: review.moderationStatus,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .populate('userId', 'username image');

    if (!updated) throw new Error('Review not found');
    return ReviewMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.reviewModel.findByIdAndDelete(id);
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    const review = await this.reviewModel
      .findById(id)
      .populate('userId', 'username image')
      .populate('bookId', 'title coverUrl');
    return review ? ReviewMapper.toDomain(review) : null;
  }

  async findByBookId(bookId: string): Promise<ReviewEntity[]> {
    const reviews = await this.reviewModel
      .find({ bookId: new Types.ObjectId(bookId) })
      .sort({ createdAt: -1 })
      .populate('userId', 'username image');
    return reviews.map(ReviewMapper.toDomain);
  }

  async findByUserId(userId: string): Promise<ReviewEntity[]> {
    const reviews = await this.reviewModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('bookId', 'title coverUrl');
    return reviews.map(ReviewMapper.toDomain);
  }

  async toggleLike(
    reviewId: string,
    userId: string,
  ): Promise<ReviewEntity | null> {
    const uid = new Types.ObjectId(userId);

    // Kiểm tra xem user đã like chưa bằng 1 query siêu tốc độ (lean, select _id)
    const existing = await this.reviewModel
      .findOne({ _id: new Types.ObjectId(reviewId), likedBy: uid }, { _id: 1 })
      .lean()
      .exec();

    const updateQuery = existing
      ? { $pull: { likedBy: uid }, $inc: { likesCount: -1 } }
      : { $addToSet: { likedBy: uid }, $inc: { likesCount: 1 } };

    // Update Atomic và populate trả về ngay lập tức
    const updated = await this.reviewModel
      .findOneAndUpdate({ _id: new Types.ObjectId(reviewId) }, updateQuery, {
        new: true,
      })
      .populate('userId', 'username image')
      .exec();

    if (!updated) return null;

    return ReviewMapper.toDomain(updated as any);
  }

  async existsByUserAndBook(userId: string, bookId: string): Promise<boolean> {
    const count = await this.reviewModel.countDocuments({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });
    return count > 0;
  }

  async getStatsForBooks(
    bookIds: string[],
  ): Promise<Map<string, { rating: number; count: number }>> {
    const objectIds = bookIds.map((id) => new Types.ObjectId(id));
    const results = await this.reviewModel
      .aggregate([
        { $match: { bookId: { $in: objectIds } } },
        {
          $group: {
            _id: '$bookId',
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ])
      .exec();

    const map = new Map<string, { rating: number; count: number }>();
    results.forEach((item) => {
      map.set(item._id.toString(), {
        rating: Math.round((item.avgRating || 0) * 10) / 10,
        count: item.reviewCount,
      });
    });
    return map;
  }

  // Statistics
  async countTotal(): Promise<number> {
    return this.reviewModel.countDocuments().exec();
  }
}
