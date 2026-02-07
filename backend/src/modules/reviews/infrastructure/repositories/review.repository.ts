import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { Review as ReviewEntity } from '../../domain/entities/review.entity';
import { ReviewMapper } from '../mappers/review.mapper';

@Injectable()
export class ReviewRepository implements IReviewRepository {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
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
    const updated = await this.reviewModel.findByIdAndUpdate(
      review.id,
      {
        content: review.content,
        rating: review.rating,
        moderationStatus: review.moderationStatus,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate('userId', 'username image');
    
    if (!updated) throw new Error('Review not found');
    return ReviewMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.reviewModel.findByIdAndDelete(id);
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    const review = await this.reviewModel.findById(id).populate('userId', 'username image').populate('bookId', 'title coverUrl');
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

  async toggleLike(reviewId: string, userId: string): Promise<ReviewEntity | null> {
     const review = await this.reviewModel.findById(reviewId);
     if (!review) return null;

     const uid = new Types.ObjectId(userId);
     const isLiked = review.likedBy.some(id => id.equals(uid));

     if (isLiked) {
         review.likedBy = review.likedBy.filter(id => !id.equals(uid));
         review.likesCount = Math.max(0, review.likesCount - 1);
     } else {
         review.likedBy.push(uid);
         review.likesCount += 1;
     }

     const updated = await review.save();
     const populated = await updated.populate('userId', 'username image');
     return ReviewMapper.toDomain(populated);
  }

  async existsByUserAndBook(userId: string, bookId: string): Promise<boolean> {
      const count = await this.reviewModel.countDocuments({ 
          userId: new Types.ObjectId(userId), 
          bookId: new Types.ObjectId(bookId) 
      });
      return count > 0;
  }

  async getStatsForBooks(bookIds: string[]): Promise<Map<string, { rating: number; count: number }>> {
      const objectIds = bookIds.map(id => new Types.ObjectId(id));
      const results = await this.reviewModel.aggregate([
          { $match: { bookId: { $in: objectIds } } },
          {
              $group: {
                  _id: '$bookId',
                  avgRating: { $avg: '$rating' },
                  reviewCount: { $sum: 1 }
              }
          }
      ]).exec();

      const map = new Map<string, { rating: number; count: number }>();
      results.forEach(item => {
          map.set(item._id.toString(), {
              rating: Math.round((item.avgRating || 0) * 10) / 10,
              count: item.reviewCount
          });
      });
      return map;
  }

  // Statistics
  async countTotal(): Promise<number> {
      return this.reviewModel.countDocuments().exec();
  }
}
