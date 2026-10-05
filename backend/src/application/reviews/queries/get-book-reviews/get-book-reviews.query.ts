import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IReviewRepository } from "@/domain/reviews/repositories/review.repository.interface";
import { Review } from "@/domain/reviews/entities/review.entity";

export class GetBookReviewsQuery extends Query<Review[]> {
  constructor(public readonly bookId: string) { super(); }
}