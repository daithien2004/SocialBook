import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetFiltersQuery } from './get-filters.query';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Injectable } from '@nestjs/common';

@QueryHandler(GetFiltersQuery)
export class GetFiltersHandler implements IQueryHandler<GetFiltersQuery, any> {
  constructor(private readonly bookRepository: IBookRepository) {}

  async execute(query: GetFiltersQuery) {
    return await this.bookRepository.getFilters();
  }
}
