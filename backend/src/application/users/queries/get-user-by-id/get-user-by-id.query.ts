import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { User } from "@/domain/users/entities/user.entity";
import { UserId } from "@/domain/users/value-objects/user-id.vo";

export class GetUserByIdQuery extends Query<User> {
  constructor(public readonly id: string) { super(); }
}
