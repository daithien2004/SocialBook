import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ReviewsRepository } from './reviews.repository';
import { ErrorMessages } from '@/src/common/constants/error-messages';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

import { ContentModerationService } from '../content-moderation/content-moderation.service';
import { ReviewModal } from './modals/review.modal';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly contentModerationService: ContentModerationService,
  ) { }

  async findAllByBook(bookId: string, userId?: string) {
    if (!Types.ObjectId.isValid(bookId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const reviews = await this.reviewsRepository.findByBookId(bookId);
    const modals = ReviewModal.fromArray(reviews);

    if (userId) {
      return modals.map((review, idx) => ({
        ...review,
        isLiked: reviews[idx].likedBy?.some((id: Types.ObjectId) => id.toString() === userId),
      }));
    }

    return modals;
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const review = await this.reviewsRepository.findByIdWithUser(id);

    if (!review) throw new NotFoundException(ErrorMessages.REVIEW_NOT_FOUND);
    return new ReviewModal(review);
  }

  async create(userId: string, dto: CreateReviewDto) {
    if (!Types.ObjectId.isValid(dto.bookId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const userObjectId = new Types.ObjectId(userId);
    const bookObjectId = new Types.ObjectId(dto.bookId);

    const existingReview = await this.reviewsRepository.existsByUserAndBook(userObjectId, bookObjectId);

    if (existingReview) {
      throw new ConflictException(ErrorMessages.REVIEW_ALREADY_EXISTS);
    }

    // Content Moderation
    const moderationResult = await this.contentModerationService.checkContent(dto.content);

    // Reject toxic/unsafe content immediately
    if (!moderationResult.isSafe) {
      const reason = moderationResult.reason ||
        (moderationResult.isSpoiler ? 'Phát hiện nội dung spoiler' :
          moderationResult.isToxic ? 'Phát hiện nội dung độc hại hoặc không phù hợp' :
            'Phát hiện nội dung không phù hợp');

      throw new BadRequestException(
        `Đánh giá của bạn bị từ chối: ${reason}. Vui lòng đảm bảo đánh giá tuân thủ nguyên tắc cộng đồng.`
      );
    }

    try {
      const newReview = await this.reviewsRepository.createReview({
        ...dto,
        userId: userObjectId,
      });
      return new ReviewModal(newReview);
    } catch (error) {
      throw new BadRequestException(ErrorMessages.REVIEW_CREATE_FAILED);
    }
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const review = await this.reviewsRepository.findById(id);

    if (!review) throw new NotFoundException(ErrorMessages.REVIEW_NOT_FOUND);

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException(ErrorMessages.REVIEW_UPDATE_FORBIDDEN);
    }

    const updatedReview = await this.reviewsRepository.updateReview(id, dto);

    return new ReviewModal(updatedReview!);
  }

  async remove(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const review = await this.reviewsRepository.findById(id);

    if (!review) throw new NotFoundException(ErrorMessages.REVIEW_NOT_FOUND);

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException(ErrorMessages.REVIEW_DELETE_FORBIDDEN);
    }

    await this.reviewsRepository.delete(id);

    return { success: true };
  }

  async toggleLike(reviewId: string, userId: string) {
    if (!Types.ObjectId.isValid(reviewId))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) throw new NotFoundException(ErrorMessages.REVIEW_NOT_FOUND);

    const uid = new Types.ObjectId(userId);
    const isLiked = review.likedBy?.some((id) => id.equals(uid));

    const update = isLiked
      ? { $pull: { likedBy: uid }, $inc: { likesCount: -1 } }
      : { $addToSet: { likedBy: uid }, $inc: { likesCount: 1 } };

    const updatedReview = await this.reviewsRepository.toggleLike(reviewId, uid, isLiked);

    return {
      likesCount: updatedReview?.likesCount,
      isLiked: !isLiked,
    };
  }
}
