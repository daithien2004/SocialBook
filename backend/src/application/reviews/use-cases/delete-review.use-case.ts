import { Injectable } from '@nestjs/common';
import { ErrorMessages } from '@/common/constants/error-messages';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { Action, Subject, AppAbility } from '@socialbook/shared';
import { subject } from '@casl/ability';

@Injectable()
export class DeleteReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(id: string, ability: AppAbility): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review)
      throw new NotFoundDomainException(ErrorMessages.REVIEW_NOT_FOUND);

    if (!ability.can(Action.Delete, subject(Subject.Review, review))) {
      throw new ForbiddenDomainException(
        'Bạn chỉ có thể xóa bình luận của chính mình',
      );
    }

    await this.reviewRepository.delete(id);
  }
}
