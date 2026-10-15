import { IChapterReadRepository } from '@/modules/chapters';
import { CreateReviewCommand } from './create-review.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IReviewRepository } from '@/modules/reviews/domain/repositories/review.repository.interface';
import { containsVietnameseToxicWords } from '@/modules/content-moderation';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Review } from '@/modules/reviews/domain/entities/review.entity';
import { ReviewErrorMessages } from '@/modules/reviews/application/error-messages';
import { IReadingProgressRepository } from '@/modules/library/domain/public-api';
import { UserId } from '@/modules/library/domain/public-api';
import { BookId } from '@/modules/library/domain/public-api';
import { ChapterStatus } from '@/modules/library/domain/public-api';
import { IRecommendationCachePort } from '@/modules/recommendations/domain/public-api';
import { ReviewResultMapper } from '../../mappers/review-result.mapper';
import { Transactional } from '@nestjs-cls/transactional';
import { ForbiddenError } from '@casl/ability';
import type { ReviewReadModel } from '../../read-models/review.read-model';

@CommandHandler(CreateReviewCommand)
export class CreateReviewHandler implements ICommandHandler<CreateReviewCommand> {
  constructor(
    private readonly reviewRepository: IReviewRepository,

    private readonly idGenerator: IIdGenerator,
    private readonly readingProgressRepository: IReadingProgressRepository,
    private readonly chapterRepository: IChapterReadRepository,
    private readonly recommendationCache: IRecommendationCachePort,
  ) {}

  async execute(command: CreateReviewCommand): Promise<ReviewReadModel> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'create',
      'Review',
    );
    const created = await this.createReview(command);
    await this.recommendationCache.clear(command.actor.userId);
    return ReviewResultMapper.fromDomain(created);
  }

  @Transactional()
  private async createReview(command: CreateReviewCommand): Promise<Review> {
    const { actor, dto } = command;
    const userId = actor.userId;
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

    const totalChapters = await this.chapterRepository.countByBook(dto.bookId);

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
      throw new ConflictDomainException(
        ReviewErrorMessages.REVIEW_ALREADY_EXISTS,
      );
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

    return created;
  }
}
