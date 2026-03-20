import { Injectable, Logger } from '@nestjs/common';
import { IVectorRepository } from '@/domain/chroma/repositories/vector.repository.interface';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { VectorDocument } from '@/domain/chroma/entities/vector-document.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@Injectable()
export class ReindexAllUseCase {
    private readonly logger = new Logger(ReindexAllUseCase.name);

    constructor(
        private readonly vectorRepository: IVectorRepository,
        private readonly bookRepository: IBookRepository,
        private readonly authorRepository: IAuthorRepository,
        private readonly chapterRepository: IChapterRepository,
        private readonly idGenerator: IIdGenerator,
    ) { }

    async execute() {
        this.logger.log('Starting full reindex of all content types');

        await this.vectorRepository.clearCollection();

        // Reindex toàn bộ
        const booksResult = await this.indexBooks();
        const authorsResult = await this.indexAuthors();
        const chaptersResult = await this.indexChapters();

        return {
            books: booksResult,
            authors: authorsResult,
            chapters: chaptersResult,
            total: booksResult.successful + authorsResult.successful + chaptersResult.successful
        };
    }

    private async indexBooks() {
        try {
            const result = await this.bookRepository.findAll({}, { page: 1, limit: 10000 });
            const books = result.data;

            if (!books || books.length === 0) {
                return { totalProcessed: 0, successful: 0, failed: 0, errors: [] };
            }

            const documents = books.map(book => {
                try {
                    const titleStr = book.title ? book.title.toString() : 'Unknown';
                    const tagsStr = Array.isArray(book.tags) ? book.tags.join(' ') : '';
                    const descStr = book.description || '';
                    const content = `${titleStr} ${descStr} ${tagsStr}`.trim() || 'No content';

                    return VectorDocument.create({
                        id: this.idGenerator.generate(),
                        contentId: book.id ? book.id.toString() : this.idGenerator.generate(),
                        contentType: 'book',
                        content,
                        metadata: {
                            title: titleStr,
                            authorId: book.authorId ? book.authorId.toString() : 'Unknown',
                        },
                        embedding: []
                    });
                } catch (mapErr) {
                    this.logger.error(`Error mapping book ${book?.id}`, mapErr);
                    return null; // Filtered out below
                }
            }).filter((doc): doc is VectorDocument => doc !== null);

            if (documents.length === 0) {
                return { totalProcessed: 0, successful: 0, failed: 0, errors: [] };
            }

            return await this.vectorRepository.saveBatch(documents);
        } catch (error) {
            this.logger.error(`Failed to index books: ${error.message}`, error);
            return { totalProcessed: 0, successful: 0, failed: 0, errors: [{ contentId: 'all', error: error.message }] };
        }
    }

    private async indexAuthors() {
        try {
            const authors = await this.authorRepository.findAll({}, { page: 1, limit: 10000 });

            if (!authors.data || authors.data.length === 0) {
                return { totalProcessed: 0, successful: 0, failed: 0, errors: [] };
            }

            const documents = authors.data.map(author => {
                try {
                    const nameStr = author.name ? author.name.toString() : 'Unknown';
                    const content = `${nameStr} ${author.bio || ''}`.trim() || 'No content';
                    return VectorDocument.create({
                        id: this.idGenerator.generate(),
                        contentId: author.id ? author.id.toString() : this.idGenerator.generate(),
                        contentType: 'author',
                        content,
                        metadata: {
                            name: nameStr,
                        },
                        embedding: []
                    });
                } catch (mapErr) {
                    this.logger.error(`Error mapping author ${author?.id}`, mapErr);
                    return null;
                }
            }).filter((doc): doc is VectorDocument => doc !== null);

            if (documents.length === 0) {
                return { totalProcessed: 0, successful: 0, failed: 0, errors: [] };
            }

            return await this.vectorRepository.saveBatch(documents);
        } catch (error) {
            this.logger.error(`Failed to index authors: ${error.message}`, error);
            return { totalProcessed: 0, successful: 0, failed: 0, errors: [{ contentId: 'all', error: error.message }] };
        }
    }

    private async indexChapters() {
        try {
            const chapters = await this.chapterRepository.findAll({}, { page: 1, limit: 50000 }); // chapters can be many

            if (!chapters.data || chapters.data.length === 0) {
                return { totalProcessed: 0, successful: 0, failed: 0, errors: [] };
            }

            const documents = chapters.data.map(chapter => {
                try {
                    const titleStr = chapter.title ? chapter.title.toString() : 'Unknown';
                    const paragraphs = chapter.paragraphs || [];
                    const textContent = paragraphs.map(p => p.content || '').join('\n');
                    const content = `${titleStr} ${textContent || ''}`.trim() || 'No content';

                    return VectorDocument.create({
                        id: this.idGenerator.generate(),
                        contentId: chapter.id ? chapter.id.toString() : this.idGenerator.generate(),
                        contentType: 'chapter',
                        content,
                        metadata: {
                            title: titleStr,
                            bookId: chapter.bookId ? chapter.bookId.toString() : 'Unknown',
                        },
                        embedding: []
                    });
                } catch (mapErr) {
                    this.logger.error(`Error mapping chapter ${chapter?.id}`, mapErr);
                    return null;
                }
            }).filter((doc): doc is VectorDocument => doc !== null);

            if (documents.length === 0) {
                return { totalProcessed: 0, successful: 0, failed: 0, errors: [] };
            }

            return await this.vectorRepository.saveBatch(documents);
        } catch (error) {
            this.logger.error(`Failed to index chapters: ${error.message}`, error);
            return { totalProcessed: 0, successful: 0, failed: 0, errors: [{ contentId: 'all', error: error.message }] };
        }
    }
}
