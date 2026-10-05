import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IUserAnalyticsRepository } from "@/domain/analytics/repositories/user-analytics.repository.interface";

export class GetTopActiveReadersQuery extends Query<{ userId: string; username: string; avatar: string | null; score: number; }[]> {
  constructor(
    public readonly days?: number,
    public readonly limit?: number,
  ) { super(); }
}
