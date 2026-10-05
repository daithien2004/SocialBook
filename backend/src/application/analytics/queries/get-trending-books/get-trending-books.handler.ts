import { GetTrendingBooksQuery } from './get-trending-books.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';

@QueryHandler(GetTrendingBooksQuery)
export class GetTrendingBooksHandler {
  constructor(private readonly analyticsRepository: IUserAnalyticsRepository) {}

  async execute(days = 1, limit = 5) {
    return this.analyticsRepository.getTrendingBooks(days, limit);
  }
}
