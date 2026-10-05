import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IBookmarkRepository } from "@/domain/bookmarks/repositories/bookmark.repository.interface";
import { Bookmark } from "@/domain/bookmarks/entities/bookmark.entity";

export class GetBookmarksByBookQuery extends Query<Bookmark[]> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) { super(); }
}
