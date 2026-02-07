import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IReviewRepository } from '../../domain/repositories/review.repository.interface';
import { UpdateReviewDto } from '../../dto/update-review.dto';
import { CheckContentUseCase } from '@/src/modules/content-moderation/application/use-cases/check-content.use-case';

@Injectable()
export class UpdateReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly checkContentUseCase: CheckContentUseCase,
  ) {}

  async execute(userId: string, reviewId: string, dto: UpdateReviewDto): Promise<any> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('You can only update your own review');
    }

    let updated = false;

    if (dto.content !== undefined) {
      const moderationResult = await this.checkContentUseCase.execute(dto.content);
      if (!moderationResult.isSafe) {
         throw new BadRequestException(`Content rejected: ${moderationResult.reason}`);
      }
      review.updateContent(dto.content);
      updated = true;
    }

    if (dto.rating !== undefined) {
      review.updateRating(dto.rating);
      updated = true;
    }
    
    if (updated) {
      return this.reviewRepository.update(review);
    }
    
    return review;
  }
}
