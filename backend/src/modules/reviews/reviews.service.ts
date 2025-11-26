import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Review, ReviewDocument } from './schemas/review.schema';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async findAllByBook(bookId: string, userId?: string) {
    if (!Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException('Invalid Book ID');
    }

    const reviews = await this.reviewModel
      .find({ bookId: new Types.ObjectId(bookId) })
      .populate('userId', 'username image email')
      .sort({ createdAt: -1 })
      .lean();

    if (userId) {
      return reviews.map((review) => ({
        ...review,
        isLiked: review.likedBy?.some((id) => id.toString() === userId),
      }));
    }

    return reviews;
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid Review ID');

    const review = await this.reviewModel
      .findById(id)
      .populate('userId', 'username image')
      .lean();

    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async create(userId: string, dto: CreateReviewDto) {
    if (!Types.ObjectId.isValid(dto.bookId)) {
      throw new BadRequestException('Invalid Book ID');
    }

    const userObjectId = new Types.ObjectId(userId);
    const bookObjectId = new Types.ObjectId(dto.bookId);

    const existingReview = await this.reviewModel.exists({
      userId: userObjectId,
      bookId: bookObjectId,
    });

    if (existingReview) {
      throw new ConflictException('Bạn đã đánh giá cuốn sách này rồi.');
    }

    try {
      const newReview = await this.reviewModel.create({
        ...dto,
        userId: userObjectId,
        bookId: bookObjectId,
      });

      return await this.reviewModel
        .findById(newReview._id)
        .populate('userId', 'username image')
        .lean();
    } catch (error) {
      throw new BadRequestException('Không thể tạo đánh giá.');
    }
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid Review ID');

    const review = await this.reviewModel.findById(id);

    if (!review) throw new NotFoundException('Review not found');

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');
    }

    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('userId', 'username image')
      .lean();

    return updatedReview;
  }

  async remove(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid Review ID');

    const review = await this.reviewModel.findById(id);

    if (!review) throw new NotFoundException('Review not found');

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.reviewModel.findByIdAndDelete(id);

    return { success: true };
  }

  async toggleLike(reviewId: string, userId: string) {
    if (!Types.ObjectId.isValid(reviewId))
      throw new BadRequestException('Invalid Review ID');

    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    const uid = new Types.ObjectId(userId);
    const isLiked = review.likedBy?.some((id) => id.equals(uid));

    const update = isLiked
      ? { $pull: { likedBy: uid }, $inc: { likesCount: -1 } }
      : { $addToSet: { likedBy: uid }, $inc: { likesCount: 1 } };

    const updatedReview = await this.reviewModel
      .findByIdAndUpdate(reviewId, update, { new: true })
      .select('likesCount likedBy');

    return {
      likesCount: updatedReview?.likesCount,
      isLiked: !isLiked,
    };
  }
}
