import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { CreateReviewDto } from '../../dto/create-review.dto';
import { CheckContentUseCase } from '@/src/modules/content-moderation/application/use-cases/check-content.use-case';
import { Review } from '../../domain/entities/review.entity';

@Injectable()
export class CreateReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly checkContentUseCase: CheckContentUseCase,
  ) {}

  async execute(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Check intersection
    const exists = await this.reviewRepository.existsByUserAndBook(userId, dto.bookId);
    if (exists) {
        throw new ConflictException('Review already exists');
    }

    // Content Moderation
    const moderationResult = await this.checkContentUseCase.execute(dto.content);
    if (!moderationResult.isSafe) {
      const reason = moderationResult.reason || 'Content is not safe';
      throw new BadRequestException(`Review rejected: ${reason}`);
    }

    const review = Review.create({
      userId,
      bookId: dto.bookId,
      content: dto.content,
      rating: dto.rating
    });

    return this.reviewRepository.create(review);
  }
}
