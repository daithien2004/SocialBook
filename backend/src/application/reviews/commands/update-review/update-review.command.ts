import { Command } from '@nestjs/cqrs';
import { UpdateReviewDto } from '@/presentation/reviews/dto/update-review.dto';
import type { AppAbility } from '@socialbook/shared';
import { Review } from '@/domain/reviews/entities/review.entity';

export class UpdateReviewCommand extends Command<Review> {
  constructor(
    public readonly reviewId: string,
    public readonly dto: UpdateReviewDto,
    public readonly ability: AppAbility,
  ) {
    super();
  }
}
