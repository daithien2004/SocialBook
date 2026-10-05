import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IUserAnalyticsRepository } from "@/domain/analytics/repositories/user-analytics.repository.interface";

export class GetTrendingBooksQuery extends Query<{ bookId: string; title: string; coverImage: string | null; score: number; }[]> {
  constructor(
    public readonly days?: number,
    public readonly limit?: number,
  ) { super(); }
}
