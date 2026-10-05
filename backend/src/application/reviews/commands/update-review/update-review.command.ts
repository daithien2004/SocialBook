import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateReviewDto } from '@/presentation/reviews/dto/update-review.dto';
import type { AppAbility, Action, Subject } from '@socialbook/shared';
import { Injectable } from "@nestjs/common";
import { ErrorMessages } from "@/common/constants/error-messages";
import { BadRequestDomainException, NotFoundDomainException, ForbiddenDomainException } from "@/shared/domain/common-exceptions";
import { IReviewRepository } from "@/domain/reviews/repositories/review.repository.interface";
import { Review } from "@/domain/reviews/entities/review.entity";
import { containsVietnameseToxicWords } from "@/domain/content-moderation/utils/vietnamese-profanity";
import { subject } from "@casl/ability";

export class UpdateReviewCommand extends Command<Review> {
  constructor(
    public readonly reviewId: string,
    public readonly dto: UpdateReviewDto,
    public readonly ability: AppAbility,
  ) { super(); }
}