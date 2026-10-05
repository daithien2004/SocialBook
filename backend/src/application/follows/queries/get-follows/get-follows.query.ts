import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IFollowRepository } from "@/domain/follows/repositories/follow.repository.interface";
import { UserId } from "@/domain/follows/value-objects/user-id.vo";
import { TargetId } from "@/domain/follows/value-objects/target-id.vo";
import { Follow } from "@/domain/follows/entities/follow.entity";
import { PaginatedResult } from "@/common/interfaces/pagination.interface";
import { Injectable, Logger } from "@nestjs/common";

export class GetFollowsQuery extends Query<PaginatedResult<Follow>> {
  constructor(
    public readonly userId?: string,
    public readonly targetId?: string,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly sortBy?: 'createdAt' | 'updatedAt',
    public readonly order?: 'asc' | 'desc',
  ) {
    super();}
}
