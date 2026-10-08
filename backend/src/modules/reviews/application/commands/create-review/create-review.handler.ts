import { BookId as ChapterBookId } from '@/modules/chapters/domain/public-api';
import { CreateReviewCommand } from './create-review.command';
import { CommandHandler } from '@nestjs/cqrs';
import {
  BadRequestDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { CreateReviewDto } from '@/modules/reviews/application/dto/create-review.dto';
import { containsVietnameseToxicWords } from '@/modules/content-moderation/domain';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Review } from '@/modules/reviews/domain/entities/review.entity';
import { ErrorMessages } from '@/common/constants/error-messages';
import { IReadingProgressRepository } from '@/modules/library/domain/public-api';
import { IChapterRepository } from '@/modules/chapters/domain/public-api';
import { UserId } from '@/modules/library/domain/public-api';
import { BookId } from '@/modules/library/domain/public-api';
import { ChapterStatus } from '@/modules/library/domain/public-api';
import { IRecommendationCachePort } from '@/modules/recommendations/domain/public-api';

@CommandHandler(CreateReviewCommand)
export class CreateReviewHandler {
  constructor(
    private readonly reviewRepository: IReviewRepository,

    private readonly idGenerator: IIdGenerator,
    private readonly readingProgressRepository: IReadingProgressRepository,
    private readonly chapterRepository: IChapterRepository,
    private readonly recommendationCache: IRecommendationCachePort,
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

    const quickCheck = containsVietnameseToxicWords(dto.content);
    if (quickCheck) {
      throw new BadRequestDomainException(
        `Nội dung chứa từ ngữ thô tục không phù hợp: "${quickCheck.matchedWord}" (nhóm: ${quickCheck.group}).`,
      );
    }

    const review = Review.create({
      id: this.idGenerator.generate(),
      userId,
      bookId: dto.bookId,
      content: dto.content,
      rating: dto.rating,
      moderationStatus: 'approved',
      isFlagged: false,
    });

    const created = await this.reviewRepository.create(review);

    void this.recommendationCache.clear(userId);

    return created;
  }
}
