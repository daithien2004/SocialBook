import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { User } from "@/domain/users/entities/user.entity";
import { PaginatedResult } from "@/common/interfaces/pagination.interface";

import { PaginationMeta } from '@/shared/domain/pagination.types';

export class GetUsersQuery extends Query<{ data: User[], meta: PaginationMeta }> {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly username?: string,
    public readonly email?: string,
    public readonly roleId?: string,
    public readonly isBanned?: boolean,
    public readonly isVerified?: boolean,
  ) { super(); }
}
