import { ChapterFilter, IChapterRepository, PaginationOptions, SortOptions } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId } from '@/domain/chapters/value-objects/book-id.vo';
import { Injectable } from '@nestjs/common';
import { GetChaptersQuery } from './get-chapters.query';

@Injectable()
export class GetChaptersUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository
    ) { }

    async execute(query: GetChaptersQuery) {
        const filter: ChapterFilter = {
            title: query.title,
            bookId: query.bookId,
            orderIndex: query.orderIndex,
            minWordCount: query.minWordCount,
            maxWordCount: query.maxWordCount
        };

        const pagination: PaginationOptions = {
            page: query.page,
            limit: query.limit
        };

        const sort: SortOptions = {
            sortBy: query.sortBy,
            order: query.order
        };

        if (query.bookSlug) {
            return await this.chapterRepository.findListByBookSlug(query.bookSlug, pagination, sort);
        } else if (query.bookId) {
            const bookId = BookId.create(query.bookId);
            return await this.chapterRepository.findByBook(bookId, pagination, sort);
        } else {
            return await this.chapterRepository.findAll(filter, pagination, sort);
        }
    }
}


