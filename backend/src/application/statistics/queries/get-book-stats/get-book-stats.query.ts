import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { BookStats } from "@/domain/statistics/read-models/statistics.model";
import { Injectable } from "@nestjs/common";

export class GetBookStatsQuery extends Query<BookStats> {
  constructor() { super(); }
}
