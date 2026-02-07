import { Injectable, Logger, Inject } from '@nestjs/common';
import { IBookRepository } from '@/src/modules/books/domain/repositories/book.repository.interface';
import { IAuthorRepository } from '@/src/modules/authors/domain/repositories/author.repository.interface';
import { IGenreRepository } from '@/src/modules/genres/domain/repositories/genre.repository.interface';
import { ScraperFactory } from '../../infrastructure/factories/scraper.factory';
import { ScrapedBookData } from '../../domain/models/scraped-data.model';
import { AuthorName } from '@/src/modules/authors/domain/value-objects/author-name.vo';
import { GenreName } from '@/src/modules/genres/domain/value-objects/genre-name.vo';
import slugify from 'slugify';

@Injectable()
export class ScrapeBookUseCase {
  private readonly logger = new Logger(ScrapeBookUseCase.name);

  constructor(
    private readonly scraperFactory: ScraperFactory,
    private readonly bookRepository: IBookRepository,
    private readonly authorRepository: IAuthorRepository,
    private readonly genreRepository: IGenreRepository,
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
       // Using 'any' cast as IAuthorRepository might strictly expect domain entities or specific methods
       // Assuming specific repository implementation handles creation or we need to update interface
       // For this refactor, we assume the repository or an underlying mechanism supports creation
       // Ideally, we would have a 'create' method in IAuthorRepository taking an Author entity
       author = await (this.authorRepository as any).create({ name: authorNameVO.toString() });
    }

    // 2. Find or Create Genres
    const genreIds: string[] = [];
    for (const genreNameStr of bookData.genres) {
        try {
            const genreNameVO = GenreName.create(genreNameStr);
            let genre = await this.genreRepository.findByName(genreNameVO);
            if (!genre) {
                genre = await (this.genreRepository as any).create({
                    name: genreNameStr,
                    slug: slugify(genreNameStr, { lower: true, strict: true, locale: 'vi' }),
                });
            }
            if (genre) {
                 // Genre.id is a GenreId value object, we need string for Book entity/schema
                 genreIds.push(genre.id.toString());
            }
        } catch (e) {
            this.logger.warn(`Skipping invalid genre name: ${genreNameStr}`);
        }
    }

    // 3. Create Book
    const slug = bookData.slug || slugify(bookData.title, { lower: true, strict: true, locale: 'vi' });
    let book = await this.bookRepository.findBySlug(slug);
    
    if (!book) {
        book = await (this.bookRepository as any).create({
            title: bookData.title,
            slug,
            authorId: author?.id.toString(),
            genres: genreIds,
            description: bookData.description,
            coverUrl: bookData.coverUrl,
            status: bookData.status,
            tags: bookData.genres,
            views: 0,
            likes: 0
        });
    }

    return book;
  }
}
