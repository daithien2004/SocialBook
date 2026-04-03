import { Injectable, Logger } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { ScraperFactory } from '@/infrastructure/scraper/factories/scraper.factory';
import { ScrapedBookData } from '@/domain/scraper/models/scraped-data.model';
import { AuthorName } from '@/domain/authors/value-objects/author-name.vo';
import { GenreName } from '@/domain/genres/value-objects/genre-name.vo';
import { Author } from '@/domain/authors/entities/author.entity';
import { AuthorId } from '@/domain/authors/value-objects/author-id.vo';
import { Genre } from '@/domain/genres/entities/genre.entity';
import { GenreId } from '@/domain/genres/value-objects/genre-id.vo';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import slugify from 'slugify';

@Injectable()
export class ScrapeBookUseCase {
  private readonly logger = new Logger(ScrapeBookUseCase.name);

  constructor(
    private readonly scraperFactory: ScraperFactory,
    private readonly bookRepository: IBookRepository,
    private readonly authorRepository: IAuthorRepository,
    private readonly genreRepository: IGenreRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(url: string): Promise<any> {
    try {
      const strategy = this.scraperFactory.getStrategy(url);
      const bookData: ScrapedBookData = await strategy.scrapeBook(url);

      return await this.saveBook(bookData);
    } catch (error) {
      this.logger.error(`Failed to scrape book from ${url}: ${error.message}`);
      throw error;
    }
  }

  private async saveBook(bookData: ScrapedBookData): Promise<any> {
    // 1. Find or Create Author
    let authorNameVO: AuthorName;
    try {
      authorNameVO = AuthorName.create(bookData.author);
    } catch (e) {
      authorNameVO = AuthorName.create('Unknown');
    }

    let author = await this.authorRepository.findByName(authorNameVO);

    if (!author) {
      author = Author.create({
        id: AuthorId.create(this.idGenerator.generate()),
        name: authorNameVO.toString(),
      });
      await this.authorRepository.save(author);
    }

    // 2. Find or Create Genres
    const genreIds: string[] = [];
    for (const genreNameStr of bookData.genres) {
      try {
        const genreNameVO = GenreName.create(genreNameStr);
        let genre = await this.genreRepository.findByName(genreNameVO);
        if (!genre) {
          genre = Genre.create({
            id: GenreId.create(this.idGenerator.generate()),
            name: genreNameStr,
          });
          await this.genreRepository.save(genre);
        }
        if (genre) {
          genreIds.push(genre.id.toString());
        }
      } catch (e) {
        this.logger.warn(`Skipping invalid genre name: ${genreNameStr}`);
      }
    }

    // 3. Create Book
    const slug =
      bookData.slug ||
      slugify(bookData.title, { lower: true, strict: true, locale: 'vi' });
    let book = await this.bookRepository.findBySlug(slug);

    if (!book) {
      book = Book.create({
        id: BookId.create(this.idGenerator.generate()),
        title: bookData.title,
        authorId: author.id.toString(),
        genres: genreIds,
        description: bookData.description,
        coverUrl: bookData.coverUrl,
        status: this.mapStatus(bookData.status),
        tags: bookData.genres,
      });
      await this.bookRepository.save(book);
    }

    return book;
  }

  private mapStatus(status: string): 'draft' | 'published' | 'completed' {
    const s = status?.toLowerCase() || '';
    if (s.includes('hoàn') || s.includes('complete')) return 'completed';
    if (s.includes('đang') || s.includes('publish') || s.includes('ongoing'))
      return 'published';
    return 'draft';
  }
}
