import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IReviewRepository } from "@/domain/reviews/repositories/review.repository.interface";
import { Review } from "@/domain/reviews/entities/review.entity";

export class ToggleReviewLikeCommand extends Command<Review> {
  constructor(
    public readonly reviewId: string,
    public readonly userId: string,
  ) { super(); }
}