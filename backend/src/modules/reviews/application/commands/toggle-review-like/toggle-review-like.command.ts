import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { ReviewReadModel } from '../../read-models/review.read-model';

export class ToggleReviewLikeCommand extends Command<ReviewReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly reviewId: string,
  ) {
    super();
  }
}
