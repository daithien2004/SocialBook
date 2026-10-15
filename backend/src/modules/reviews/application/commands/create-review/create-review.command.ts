import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { CreateReviewDto } from '@/modules/reviews/application/dto/create-review.dto';
import type { ReviewReadModel } from '../../read-models/review.read-model';

export class CreateReviewCommand extends Command<ReviewReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly dto: CreateReviewDto,
  ) {
    super();
  }
}
