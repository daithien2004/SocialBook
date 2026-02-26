import { ChapterFilter, IChapterRepository, PaginationOptions, SortOptions } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId } from '@/domain/chapters/value-objects/book-id.vo';
import { Injectable } from '@nestjs/common';
import { GetChaptersQuery } from './get-chapters.query';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { ChapterResult } from './get-chapters.result';
import { ChapterApplicationMapper } from '../../mappers/chapter.mapper';
import { ChapterListReadModel } from '@/domain/chapters/read-models/chapter-list.read-model';

@Injectable()
export class GetChaptersUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository
    ) { }

    async execute(query: GetChaptersQuery): Promise<PaginatedResult<ChapterResult> | ChapterListReadModel> {
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
            const result = await this.chapterRepository.findByBook(bookId, pagination, sort);
            return {
                data: result.data.map(chapter => ChapterApplicationMapper.toResult(chapter)),
                meta: result.meta
            };
        } else {
            const result = await this.chapterRepository.findAll(filter, pagination, sort);
            return {
                data: result.data.map(chapter => ChapterApplicationMapper.toResult(chapter)),
                meta: result.meta
            };
        }
    }
}


