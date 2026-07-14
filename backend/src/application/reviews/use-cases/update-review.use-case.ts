import { Injectable } from '@nestjs/common';
import { ErrorMessages } from '@/common/constants/error-messages';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { Review } from '@/domain/reviews/entities/review.entity';
import { UpdateReviewDto } from '@/application/reviews/dto/update-review.dto';
import { containsVietnameseToxicWords } from '@/domain/content-moderation/utils/vietnamese-profanity';

@Injectable()
export class UpdateReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundDomainException(ErrorMessages.REVIEW_NOT_FOUND);
    }

    if (review.userId !== userId) {
      throw new BadRequestDomainException(
        ErrorMessages.REVIEW_UPDATE_FORBIDDEN,
      );
    }

    let updated = false;

    if (dto.content !== undefined) {
      const quickCheck = containsVietnameseToxicWords(dto.content);
      if (quickCheck) {
        throw new BadRequestDomainException(
          `Nội dung chứa từ ngữ thô tục không phù hợp: "${quickCheck.matchedWord}" (nhóm: ${quickCheck.group}).`,
        );
      }
      review.updateContent(dto.content);
      updated = true;
    }

    if (dto.rating !== undefined) {
      review.updateRating(dto.rating);
      updated = true;
    }

    if (updated) {
      return this.reviewRepository.update(review);
    }

    return review;
  }
}
