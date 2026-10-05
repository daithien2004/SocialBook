import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateReviewDto } from '@/presentation/reviews/dto/create-review.dto';
import { Injectable } from "@nestjs/common";
import { BadRequestDomainException, ConflictDomainException } from "@/shared/domain/common-exceptions";
import { IReviewRepository } from "@/domain/reviews/repositories/review.repository.interface";
import { containsVietnameseToxicWords } from "@/domain/content-moderation/utils/vietnamese-profanity";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";
import { Review } from "@/domain/reviews/entities/review.entity";
import { ErrorMessages } from "@/common/constants/error-messages";
import { IReadingProgressRepository } from "@/domain/library/repositories/reading-progress.repository.interface";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { UserId } from "@/domain/library/value-objects/user-id.vo";
import { BookId } from "@/domain/library/value-objects/book-id.vo";
import { ChapterStatus } from "@/domain/library/entities/reading-progress.entity";
import { IRecommendationCachePort } from "@/domain/recommendations/interfaces/recommendation-cache.port";

export class CreateReviewCommand extends Command<Review> {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateReviewDto,
  ) { super(); }
}