import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PaginationOptions } from "@/common/interfaces/pagination.interface";
import { AuthorFilter, IAuthorRepository } from "@/domain/authors/repositories/author.repository.interface";
import { PaginatedResult } from "@/shared/domain/pagination.types";
import { Author } from "@/domain/authors/entities/author.entity";

export class GetAuthorsQuery extends Query<PaginatedResult<Author>> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly name?: string,
    public readonly bio?: string,
  ) {
    super();}
}
