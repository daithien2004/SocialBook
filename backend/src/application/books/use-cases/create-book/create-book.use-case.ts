import { Injectable, Inject } from '@nestjs/common';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IAuthorRepository } from '@/domain/authors/repositories/author.repository.interface';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/domain/books/value-objects/book-title.vo';
import { CreateBookCommand } from './create-book.command';
import { BOOK_CACHE_SERVICE } from '@/domain/books/interfaces/book-cache.service.interface';
import type { IBookCacheService } from '@/domain/books/interfaces/book-cache.service.interface';
import { Author } from '@/domain/authors/entities/author.entity';
import { AuthorId } from '@/domain/authors/value-objects/author-id.vo';
import { AuthorName } from '@/domain/authors/value-objects/author-name.vo';
import { Genre } from '@/domain/genres/entities/genre.entity';
import { GenreId } from '@/domain/genres/value-objects/genre-id.vo';
import { GenreName } from '@/domain/genres/value-objects/genre-name.vo';

@Injectable()
export class CreateBookUseCase {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly authorRepository: IAuthorRepository,
    private readonly genreRepository: IGenreRepository,
    private readonly idGenerator: IIdGenerator,
    @Inject(BOOK_CACHE_SERVICE) private readonly bookCache: IBookCacheService,
  ) {}

  async execute(command: CreateBookCommand): Promise<Book> {
    const title = BookTitle.create(command.title);

    // Check if book with same title already exists
    const exists = await this.bookRepository.existsByTitle(title);

    if (exists) {
      throw new ConflictDomainException('Book with this title already exists');
    }

    // Validate that genres array is not empty and has max 5 items
    if (!command.genres || command.genres.length === 0) {
      throw new Error('Book must have at least one genre');
    }

    if (command.genres.length > 5) {
      throw new Error('Book cannot have more than 5 genres');
    }

    let finalAuthorId = command.authorId;

    // Handle automatic author creation if authorId is a new name or is explicitly requested
    if (
      command.authorName &&
      (!finalAuthorId || finalAuthorId.startsWith('new:'))
    ) {
      const authorName = AuthorName.create(command.authorName);
      const existingAuthor = await this.authorRepository.findByName(authorName);

      if (existingAuthor) {
        finalAuthorId = existingAuthor.id.toString();
      } else {
        const newAuthor = Author.create({
          id: AuthorId.create(this.idGenerator.generate()),
          name: command.authorName,
          bio: '',
          photoUrl: '',
        });
        await this.authorRepository.save(newAuthor);
        finalAuthorId = newAuthor.id.toString();
      }
    }

    // Handle automatic genre creation
    const finalGenreIds: string[] = [];
    for (const genreIdOrName of command.genres) {
      if (genreIdOrName.startsWith('new:')) {
        const genreNameStr = genreIdOrName.replace('new:', '');
        const genreName = GenreName.create(genreNameStr);
        const existingGenre = await this.genreRepository.findByName(genreName);

        if (existingGenre) {
          finalGenreIds.push(existingGenre.id.toString());
        } else {
          const newGenre = Genre.create({
            id: GenreId.create(this.idGenerator.generate()),
            name: genreNameStr,
          });
          await this.genreRepository.save(newGenre);
          finalGenreIds.push(newGenre.id.toString());
        }
      } else {
        finalGenreIds.push(genreIdOrName);
      }
    }

    const book = Book.create({
      id: BookId.create(this.idGenerator.generate()),
      title: command.title,
      authorId: finalAuthorId,
      genres: finalGenreIds,
      description: command.description,
      publishedYear: command.publishedYear,
      coverUrl: command.coverUrl,
      status: command.status,
      tags: command.tags,
    });

    await this.bookRepository.save(book);

    // cập nhật lại cache thông qua service chuyên biệt
    await this.bookCache.setDetail(book);

    return book;
  }
}
