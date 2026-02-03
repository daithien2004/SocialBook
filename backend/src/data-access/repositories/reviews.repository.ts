import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { CreateReviewDto } from '../../modules/reviews/dto/create-review.dto';
import { UpdateReviewDto } from '../../modules/reviews/dto/update-review.dto';
import { Review, ReviewDocument } from '../../modules/reviews/schemas/review.schema';
import { GenericRepository } from '../../shared/repository/generic.repository';

@Injectable()
export class ReviewsRepository extends GenericRepository<ReviewDocument> {
    constructor(@InjectModel(Review.name) reviewModel: Model<ReviewDocument>) {
        super(reviewModel);
    }

    async findByBookId(bookId: string | Types.ObjectId): Promise<ReviewDocument[]> {
        return this.model
            .find({ bookId })
            .populate('userId', 'username image email')
            .sort({ createdAt: -1 })
            .lean()
            .exec() as unknown as ReviewDocument[];
    }

    async findByIdWithUser(id: string | Types.ObjectId) {
        return this.model
            .findById(id)
            .populate('userId', 'username image')
            .lean()
            .exec();
    }

    async existsByUserAndBook(userId: string | Types.ObjectId, bookId: string | Types.ObjectId): Promise<boolean> {
        const result = await this.model.exists({ userId, bookId });
        return !!result;
    }

    async createReview(data: CreateReviewDto & { userId: Types.ObjectId }) {
        const newReview = await this.model.create(data);
        return this.findByIdWithUser(newReview._id);
    }

    async updateReview(id: string | Types.ObjectId, dto: UpdateReviewDto) {
        return this.model
            .findByIdAndUpdate(id, dto, { new: true })
            .populate('userId', 'username image')
            .lean()
            .exec();
    }

    async toggleLike(reviewId: string | Types.ObjectId, userId: string | Types.ObjectId, isLiked: boolean) {
        const update: UpdateQuery<ReviewDocument> = isLiked
            ? { $pull: { likedBy: userId as any }, $inc: { likesCount: -1 } }
            : { $addToSet: { likedBy: userId as any }, $inc: { likesCount: 1 } };

        return this.model
            .findByIdAndUpdate(reviewId, update, { new: true })
            .select('likesCount likedBy')
            .exec();
    }

    async getAggregates(bookId: string | Types.ObjectId) {
        const stats = await this.model.aggregate([
            { $match: { bookId: new Types.ObjectId(bookId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalRatings: { $sum: 1 },
                },
            },
        ]);

        const data = stats[0] || {};
        return {
            averageRating: data.averageRating
                ? Math.round(data.averageRating * 10) / 10
                : 0,
            totalRatings: data.totalRatings || 0,
        };
    }

    async getRatingDistribution(bookId: string | Types.ObjectId) {
        const distribution = await this.model.aggregate([
            { $match: { bookId: new Types.ObjectId(bookId) } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
        ]);

        const result: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach((item) => {
            if (result[item._id] !== undefined) {
                result[item._id] = item.count;
            }
        });
        return result;
    }
}
