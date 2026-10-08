import { Command } from '@nestjs/cqrs';
import { UpdateReviewDto } from '@/modules/reviews/presentation/dto/update-review.dto';
import type { AppAbility } from '@socialbook/shared';
import { Review } from '@/modules/reviews/domain/entities/review.entity';

export class UpdateReviewCommand extends Command<Review> {
  constructor(
    public readonly reviewId: string,
    public readonly dto: UpdateReviewDto,
    public readonly ability: AppAbility,
  ) {
    super();
  }
}
