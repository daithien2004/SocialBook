import { Command } from '@nestjs/cqrs';
import { CreateReviewDto } from '@/presentation/reviews/dto/create-review.dto';
export class CreateReviewCommand extends Command<any> {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateReviewDto,
  ) { super(); }
}