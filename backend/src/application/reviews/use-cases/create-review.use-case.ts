import { Injectable } from '@nestjs/common';
import {
  BadRequestDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/domain/reviews/repositories/review.repository.interface';
import { CreateReviewDto } from '@/application/reviews/dto/create-review.dto';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Review } from '@/domain/reviews/entities/review.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { IReadingProgressRepository } from '@/domain/library/repositories/reading-progress.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { UserId } from '@/domain/library/value-objects/user-id.vo';
import { BookId } from '@/domain/library/value-objects/book-id.vo';
import { ChapterStatus } from '@/domain/library/entities/reading-progress.entity';
import { BookId as ChapterBookId } from '@/domain/chapters/value-objects/book-id.vo';
import { RecommendationCachePort } from '@/domain/recommendations/interfaces/recommendation-cache.port';

@Injectable()
export class CreateReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly idGenerator: IIdGenerator,
    private readonly readingProgressRepository: IReadingProgressRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly recommendationCache: RecommendationCachePort,
  ) {}

  async execute(userId: string, dto: CreateReviewDto): Promise<Review> {
    const userIdVo = UserId.create(userId);
    const bookIdVo = BookId.create(dto.bookId);

    const readProgresses =
      await this.readingProgressRepository.findByUserIdAndBookId(
        userIdVo,
        bookIdVo,
      );

    const completedChaptersCount = readProgresses.filter(
      (p) => p.status === ChapterStatus.COMPLETED,
    ).length;

    const totalChapters = await this.chapterRepository.countByBook(
      ChapterBookId.create(dto.bookId),
    );

    const requiredChapters = Math.min(10, totalChapters);

    if (completedChaptersCount < requiredChapters) {
      throw new BadRequestDomainException(
        `Bạn cần đọc ít nhất ${requiredChapters} chương để có thể đánh giá cuốn sách này (Hiện tại: ${completedChaptersCount}/${requiredChapters}).`,
      );
    }

    const exists = await this.reviewRepository.existsByUserAndBook(
      userId,
      dto.bookId,
    );
    if (exists) {
      throw new ConflictDomainException(ErrorMessages.REVIEW_ALREADY_EXISTS);
    }

    const moderationResult = await this.checkContentUseCase.execute(
      dto.content,
    );

    if (moderationResult.action === 'BLOCK') {
      throw new BadRequestDomainException(
        moderationResult.reason || 'Nội dung vi phạm tiêu chuẩn cộng đồng.',
      );
    }

    const isReviewRequired = moderationResult.action === 'REVIEW';

    const review = Review.create({
      id: this.idGenerator.generate(),
      userId,
      bookId: dto.bookId,
      content: dto.content,
      rating: dto.rating,
      moderationStatus: isReviewRequired ? 'pending' : 'approved',
      isFlagged: isReviewRequired,
    });

    const created = await this.reviewRepository.create(review);

    this.recommendationCache.clear(userId);

    return created;
  }
}
