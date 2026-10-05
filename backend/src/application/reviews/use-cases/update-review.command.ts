import { Command } from '@nestjs/cqrs';
import { UpdateReviewDto } from '@/presentation/reviews/dto/update-review.dto';
import type { AppAbility } from '@socialbook/shared';
export class UpdateReviewCommand extends Command<any> {
  constructor(
    public readonly reviewId: string,
    public readonly dto: UpdateReviewDto,
    public readonly ability: AppAbility,
  ) { super(); }
}