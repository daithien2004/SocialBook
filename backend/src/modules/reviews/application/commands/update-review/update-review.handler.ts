import { UpdateReviewCommand } from './update-review.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { ReviewErrorMessages } from '@/modules/reviews/application/error-messages';
import {
  BadRequestDomainException,
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { containsVietnameseToxicWords } from '@/modules/content-moderation';
import { subject } from '@casl/ability';
import { ReviewResultMapper } from '../../mappers/review-result.mapper';
import type { ReviewReadModel } from '../../read-models/review.read-model';

@CommandHandler(UpdateReviewCommand)
export class UpdateReviewHandler implements ICommandHandler<UpdateReviewCommand> {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  @Transactional()
  async execute(command: UpdateReviewCommand): Promise<ReviewReadModel> {
    const { reviewId, dto, actor } = command;
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundDomainException(ReviewErrorMessages.REVIEW_NOT_FOUND);
    }

    if (!actor.ability.can('update', subject('Review', review))) {
      throw new ForbiddenDomainException(
        ReviewErrorMessages.REVIEW_UPDATE_FORBIDDEN,
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
      const persisted = await this.reviewRepository.update(review);
      return ReviewResultMapper.fromDomain(
        persisted,
        persisted.likedBy.includes(actor.userId),
      );
    }

    return ReviewResultMapper.fromDomain(
      review,
      review.likedBy.includes(actor.userId),
    );
  }
}
