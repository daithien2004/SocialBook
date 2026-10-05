import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { Injectable, Logger } from "@nestjs/common";

export class GetBookFiltersQuery extends Query<{ genres: { id: string; name: string; slug: string; count: number; }[]; tags: { name: string; count: number; }[]; }> {
  constructor() { super(); }
}
