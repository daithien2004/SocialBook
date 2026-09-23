import { Injectable } from '@nestjs/common';
import { ErrorMessages } from '@/common/constants/error-messages';
import {
  BadRequestDomainException,
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { Review } from '@/domain/reviews/entities/review.entity';
import { UpdateReviewDto } from '@/application/reviews/dto/update-review.dto';
import { containsVietnameseToxicWords } from '@/domain/content-moderation/utils/vietnamese-profanity';
import { Action, Subject, AppAbility } from '@socialbook/shared';
import { subject } from '@casl/ability';

@Injectable()
export class UpdateReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(
    reviewId: string,
    dto: UpdateReviewDto,
    ability: AppAbility,
  ): Promise<Review> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundDomainException(ErrorMessages.REVIEW_NOT_FOUND);
    }

    if (!ability.can(Action.Update, subject(Subject.Review, review))) {
      throw new ForbiddenDomainException(ErrorMessages.REVIEW_UPDATE_FORBIDDEN);
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
