import { DeleteReviewCommand } from './delete-review.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transactional } from '@nestjs-cls/transactional';
import { ReviewErrorMessages } from '@/modules/reviews/application/error-messages';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { subject } from '@casl/ability';

@CommandHandler(DeleteReviewCommand)
export class DeleteReviewHandler implements ICommandHandler<DeleteReviewCommand> {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  @Transactional()
  async execute(command: DeleteReviewCommand): Promise<void> {
    const { id, actor } = command;
    const review = await this.reviewRepository.findById(id);
    if (!review)
      throw new NotFoundDomainException(ReviewErrorMessages.REVIEW_NOT_FOUND);

    if (!actor.ability.can('delete', subject('Review', review))) {
      throw new ForbiddenDomainException(
        'Bạn chỉ có thể xóa bình luận của chính mình',
      );
    }

    await this.reviewRepository.delete(id);
  }
}
