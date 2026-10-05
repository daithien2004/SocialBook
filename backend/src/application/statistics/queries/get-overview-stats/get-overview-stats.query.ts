import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { IPostRepository } from "@/domain/posts/repositories/post.repository.interface";
import { ICommentRepository } from "@/domain/comments/repositories/comment.repository.interface";
import { IReviewRepository } from "@/domain/reviews/repositories/review.repository.interface";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { OverviewStats } from "@/domain/statistics/read-models/statistics.model";

export class GetOverviewStatsQuery extends Query<OverviewStats> {
  constructor() { super(); }
}
