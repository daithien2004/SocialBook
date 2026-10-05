import { Command } from '@nestjs/cqrs';
import { CreateReviewDto } from '@/presentation/reviews/dto/create-review.dto';
import { Review } from '@/domain/reviews/entities/review.entity';

export class CreateReviewCommand extends Command<Review> {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateReviewDto,
  ) {
    super();
  }
}
