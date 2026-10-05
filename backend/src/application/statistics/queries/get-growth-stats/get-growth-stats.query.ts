import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IBookQueryProvider } from "@/domain/books/repositories/book-query.provider.interface";
import { IPostRepository } from "@/domain/posts/repositories/post.repository.interface";
import { GrowthMetric } from "@/domain/statistics/read-models/statistics.model";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { Injectable } from "@nestjs/common";

export class GetGrowthStatsQuery extends Query<GrowthMetric[]> {
  constructor() { super(); }
}
