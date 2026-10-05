import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IBookmarkRepository } from '@/domain/bookmarks/repositories/bookmark.repository.interface';
import { Bookmark } from '@/domain/bookmarks/entities/bookmark.entity';
import { GetBookmarksByBookQuery } from './get-bookmarks-by-book.query';

@QueryHandler(GetBookmarksByBookQuery)
export class GetBookmarksByBookHandler {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  async execute(query: GetBookmarksByBookQuery): Promise<Bookmark[]> {
    return this.bookmarkRepository.findByBook(query.userId, query.bookId);
  }
}
