import { Injectable } from '@nestjs/common';
import { ErrorMessages } from '@/common/constants/error-messages';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { UpdateReviewDto } from '@/application/reviews/dto/update-review.dto';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';

@Injectable()
export class UpdateReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly checkContentUseCase: CheckContentUseCase,
  ) {}

  async execute(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<any> {
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
      const moderationResult = await this.checkContentUseCase.execute(
        dto.content,
      );
      if (!moderationResult.isSafe) {
        throw new BadRequestDomainException(
          `Nội dung bị từ chối: ${moderationResult.reason}`,
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
