import { GetUserHighlightsQuery } from './get-user-highlights.query';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IUserHighlightRepository } from '@/domain/user-highlights/repositories/user-highlight.repository.interface';
import { UserHighlight } from '@/domain/user-highlights/entities/user-highlight.entity';

@QueryHandler(GetUserHighlightsQuery)
export class GetUserHighlightsHandler {
  constructor(private readonly highlightRepository: IUserHighlightRepository) {}

  async execute(query: GetUserHighlightsQuery): Promise<UserHighlight[]> {
    if (query.chapterId) {
      return this.highlightRepository.findByChapterId(
        query.userId,
        query.chapterId,
      );
    }
    if (query.bookId) {
      return this.highlightRepository.findByBookId(query.userId, query.bookId);
    }
    return [];
  }
}
