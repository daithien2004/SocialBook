import { Injectable } from '@nestjs/common';
import { ErrorMessages } from '@/common/constants/error-messages';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';

@Injectable()
export class DeleteReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundDomainException(ErrorMessages.REVIEW_NOT_FOUND);

    if (review.userId.toString() !== userId) {
      throw new ForbiddenDomainException(
        'Bạn chỉ có thể xóa bình luận của chính mình',
      );
    }

    await this.reviewRepository.delete(id);
  }
}
