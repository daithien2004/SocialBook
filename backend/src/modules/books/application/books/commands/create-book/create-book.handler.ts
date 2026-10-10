import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import {
  IAuthorRepository,
  AuthorEntity as Author,
  AuthorId,
  AuthorName,
} from '@/modules/authors';
import {
  IGenreRepository,
  GenreEntity as Genre,
  GenreId,
  GenreName,
} from '@/modules/genres';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { randomUUID } from 'node:crypto';
import { UnitOfWorkPort } from '@/shared/application/unit-of-work.port';
import { BookOutboxPort } from '@/modules/books/application/public-api';
import { Book } from '@/modules/books/domain/books/entities/book.entity';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/modules/books/domain/books/value-objects/book-title.vo';
import { CreateBookCommand } from './create-book.command';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';

@CommandHandler(CreateBookCommand)
export class CreateBookHandler implements ICommandHandler<
  CreateBookCommand,
  Book
> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly authorRepository: IAuthorRepository,
    private readonly genreRepository: IGenreRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly bookCache: IBookCachePort,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly bookOutbox: BookOutboxPort,
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
      throw new BadRequestException('Book must have at least one genre');
    }

    if (command.genres.length > 5) {
      throw new BadRequestException('Book cannot have more than 5 genres');
    }

    const book = await this.unitOfWork.execute(async () => {
      let finalAuthorId = command.authorId;

      // Handle automatic author creation if authorId is a new name or is explicitly requested
      if (
        command.authorName &&
        (!finalAuthorId || finalAuthorId.startsWith('new:'))
      ) {
        const authorName = AuthorName.create(command.authorName);
        const existingAuthor =
          await this.authorRepository.findByName(authorName);

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
          const existingGenre =
            await this.genreRepository.findByName(genreName);

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
      await this.bookOutbox.append({
        id: randomUUID(),
        type: 'book.created',
        bookId: book.id.toString(),
      });
      return book;
    });
    book.markPersisted(0);

    // cáº­p nháº­t láº¡i cache thÃ´ng qua service chuyÃªn biá»‡t
    await this.bookCache.setDetail(book);

    // Emit event Ä‘á»ƒ ChromaDB listener (vÃ  cÃ¡c listener khÃ¡c) báº¯t vÃ  xá»­ lÃ½
    return book;
  }
}
