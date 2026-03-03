import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GetFiltersUseCase {
    constructor(
        private readonly bookRepository: IBookRepository
    ) { }

    async execute() {
        return await this.bookRepository.getFilters();
    }
}
