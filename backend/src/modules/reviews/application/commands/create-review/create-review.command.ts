import { Command } from '@nestjs/cqrs';
import { CreateReviewDto } from '@/modules/reviews/presentation/dto/create-review.dto';
import { Review } from '@/modules/reviews/domain/entities/review.entity';

export class CreateReviewCommand extends Command<Review> {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateReviewDto,
  ) {
    super();
  }
}
