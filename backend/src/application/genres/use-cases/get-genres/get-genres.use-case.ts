import { Injectable } from '@nestjs/common';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { Genre } from '@/domain/genres/entities/genre.entity';
import { GetGenresQuery } from './get-genres.query';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';

@Injectable()
export class GetGenresUseCase {
    constructor(
        private readonly genreRepository: IGenreRepository
    ) {}

    async execute(query: GetGenresQuery): Promise<PaginatedResult<Genre>> {
        return this.genreRepository.findAll(
            { name: query.name },
            { page: query.page, limit: query.limit }
        );
    }
}


