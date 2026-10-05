import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IReviewRepository } from "@/domain/reviews/repositories/review.repository.interface";
import { Review } from "@/domain/reviews/entities/review.entity";
import { ErrorMessages } from "@/common/constants/error-messages";

export class GetReviewQuery extends Query<Review> {
  constructor() { super(); }
}
