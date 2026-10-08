import { DeleteReviewCommand } from './delete-review.command';
import { CommandHandler } from '@nestjs/cqrs';
import { ReviewErrorMessages } from '@/modules/reviews/application/error-messages';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { Action, Subject, AppAbility } from '@socialbook/shared';
import { subject } from '@casl/ability';

@CommandHandler(DeleteReviewCommand)
export class DeleteReviewHandler {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(id: string, ability: AppAbility): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review)
      throw new NotFoundDomainException(ReviewErrorMessages.REVIEW_NOT_FOUND);

    if (!ability.can(Action.Delete, subject(Subject.Review, review))) {
      throw new ForbiddenDomainException(
        'Báº¡n chá»‰ cÃ³ thá»ƒ xÃ³a bÃ¬nh luáº­n cá»§a chÃ­nh mÃ¬nh',
      );
    }

    await this.reviewRepository.delete(id);
  }
}
