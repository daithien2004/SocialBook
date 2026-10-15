import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { UpdateReviewDto } from '@/modules/reviews/application/dto/update-review.dto';
import type { ReviewReadModel } from '../../read-models/review.read-model';

export class UpdateReviewCommand extends Command<ReviewReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly reviewId: string,
    public readonly dto: UpdateReviewDto,
  ) {
    super();
  }
}
