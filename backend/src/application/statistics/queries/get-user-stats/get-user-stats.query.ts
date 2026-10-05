import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserStats } from "@/domain/statistics/read-models/statistics.model";

export class GetUserStatsQuery extends Query<UserStats> {
  constructor() { super(); }
}
