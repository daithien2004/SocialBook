import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IUserHighlightRepository } from "@/domain/user-highlights/repositories/user-highlight.repository.interface";
import { UserHighlight } from "@/domain/user-highlights/entities/user-highlight.entity";

export class GetUserHighlightsQuery extends Query<UserHighlight[]> {
  constructor(
    public readonly userId: string,
    public readonly bookId?: string,
    public readonly chapterId?: string,
  ) { super(); }
}