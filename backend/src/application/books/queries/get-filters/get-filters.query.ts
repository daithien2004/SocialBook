import { Query } from '@nestjs/cqrs';
import { BookFilters } from "@/domain/books/repositories/book.repository.interface";

export class GetFiltersQuery extends Query<BookFilters> {
  constructor() { super(); }
}