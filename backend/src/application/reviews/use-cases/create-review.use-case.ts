import { Injectable } from '@nestjs/common';
import { BadRequestDomainException, ConflictDomainException } from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { CreateReviewDto } from '@/presentation/reviews/dto/create-review.dto';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Review } from '@/domain/reviews/entities/review.entity';

@Injectable()
export class CreateReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Check intersection
    const exists = await this.reviewRepository.existsByUserAndBook(userId, dto.bookId);
    if (exists) {
        throw new ConflictDomainException('Review already exists');
    }

    // Content Moderation
    const moderationResult = await this.checkContentUseCase.execute(dto.content);
    if (!moderationResult.isSafe) {
      const reason = moderationResult.reason || 'Content is not safe';
      throw new BadRequestDomainException(`Review rejected: ${reason}`);
    }

    const review = Review.create({
      id: this.idGenerator.generate(),
      userId,
      bookId: dto.bookId,
      content: dto.content,
      rating: dto.rating
    });

    return this.reviewRepository.create(review);
  }
}

