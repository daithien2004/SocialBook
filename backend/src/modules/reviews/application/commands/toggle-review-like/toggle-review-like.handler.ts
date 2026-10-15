import { ToggleReviewLikeCommand } from './toggle-review-like.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { ReviewResultMapper } from '../../mappers/review-result.mapper';
import { subject } from '@casl/ability';
import { ForbiddenDomainException } from '@/shared/domain/common-exceptions';
import type { ReviewReadModel } from '../../read-models/review.read-model';

@CommandHandler(ToggleReviewLikeCommand)
export class ToggleReviewLikeHandler implements ICommandHandler<ToggleReviewLikeCommand> {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  @Transactional()
  async execute(command: ToggleReviewLikeCommand): Promise<ReviewReadModel> {
    const review = await this.reviewRepository.findById(command.reviewId);
    if (!review) throw new NotFoundDomainException('Review not found');
    if (!command.actor.ability.can('like', subject('Review', review))) {
      throw new ForbiddenDomainException('You cannot like this review');
    }

    const result = await this.reviewRepository.toggleLike(
      command.reviewId,
      command.actor.userId,
    );
    if (!result) throw new NotFoundDomainException('Review not found');
    return ReviewResultMapper.fromDomain(
      result,
      result.likedBy.includes(command.actor.userId),
    );
  }
}
