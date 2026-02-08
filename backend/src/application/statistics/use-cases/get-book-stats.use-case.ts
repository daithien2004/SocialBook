import { Injectable } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookStats } from '@/domain/statistics/models/statistics.model';

@Injectable()
export class GetBookStatsUseCase {
    constructor(
        private readonly bookRepository: IBookRepository,
        private readonly chapterRepository: IChapterRepository,
    ) {}

    async execute(): Promise<BookStats> {
        const [
            total,
            totalChapters,
            byGenre,
            popularBooksResult
        ] = await Promise.all([
            this.bookRepository.countTotal(),
            this.chapterRepository.countTotal(),
            this.bookRepository.countByGenreName(),
            this.bookRepository.findPopular({ page: 1, limit: 10 })
        ]);

        return {
            total,
            totalChapters,
            byGenre: byGenre.map(g => ({ genres: g.genre, count: g.count })),
            popularBooks: popularBooksResult.data.map(book => ({
                id: book.id.toString(),
                title: book.title.toString(),
                slug: book.slug,
                views: book.views,
                likes: book.likes
            }))
        };
    }
}

