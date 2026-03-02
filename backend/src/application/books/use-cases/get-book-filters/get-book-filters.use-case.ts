import { Injectable, Logger } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { GetBookFiltersQuery } from './get-book-filters.query';

@Injectable()
export class GetBookFiltersUseCase {
    private readonly logger = new Logger(GetBookFiltersUseCase.name);

    constructor(
        private readonly bookRepository: IBookRepository,
    ) { }

    async execute(query: GetBookFiltersQuery) {
        try {
            const [genres, tags] = await Promise.all([
                this.bookRepository.countByGenreName(),
                this.bookRepository.countByTags()
            ]);

            return {
                genres,
                tags
            };
        } catch (error) {
            this.logger.error('Failed to get book filters', error);
            throw error;
        }
    }
}
