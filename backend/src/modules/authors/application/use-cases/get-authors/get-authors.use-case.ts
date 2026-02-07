import { Injectable } from '@nestjs/common';
import { IAuthorRepository, AuthorFilter, PaginationOptions } from '../../../domain/repositories/author.repository.interface';
import { GetAuthorsQuery } from './get-authors.query';

@Injectable()
export class GetAuthorsUseCase {
    constructor(
        private readonly authorRepository: IAuthorRepository
    ) {}

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
