import { PaginationOptions } from '@/common/interfaces/pagination.interface';
import { AuthorFilter, IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { Injectable } from '@nestjs/common';
import { GetAuthorsQuery } from './get-authors.query';

@Injectable()
export class GetAuthorsUseCase {
    constructor(
        private readonly authorRepository: IAuthorRepository
    ) { }

    async execute(query: GetAuthorsQuery) {
        const filter: AuthorFilter = {
            name: query.name,
            bio: query.bio
        };

        const pagination: PaginationOptions = {
            page: query.page,
            limit: query.limit
        };

        return await this.authorRepository.findAll(filter, pagination);
    }
}


