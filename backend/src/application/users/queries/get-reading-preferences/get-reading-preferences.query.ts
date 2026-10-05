import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { ReadingPreferences } from "@/domain/users/value-objects/reading-preferences.vo";

export class GetReadingPreferencesQuery extends Query<ReadingPreferences> {
  constructor(public readonly userId: string) { super(); }
}
