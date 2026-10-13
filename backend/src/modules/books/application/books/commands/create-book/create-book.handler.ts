import { BadRequestException } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import {
  IAuthorRepository,
  AuthorEntity,
  AuthorId,
  AuthorName,
} from '@/modules/authors';
import { BookOutboxPort } from '@/modules/books/application/public-api';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { Book } from '@/modules/books/domain/books/entities/book.entity';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/modules/books/domain/books/value-objects/book-title.vo';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { CreateBookCommand } from './create-book.command';
import {
  IGenreRepository,
  GenreEntity,
  GenreId,
  GenreName,
} from '@/modules/genres';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ConflictDomainException } from '@/shared/domain/common-exceptions';

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
    private readonly bookOutbox: BookOutboxPort,
  ) {}

  async execute(command: CreateBookCommand): Promise<Book> {
    if (command.genres.length === 0) {
      throw new BadRequestException('Book must have at least one genre');
    }
    if (command.genres.length > 5) {
      throw new BadRequestException('Book cannot have more than 5 genres');
    }

    const book = await this.createBook(command);
    await this.bookCache.setDetail(book);
    return book;
  }

  @Transactional()
  private async createBook(command: CreateBookCommand): Promise<Book> {
    const title = BookTitle.create(command.title);
    if (await this.bookRepository.existsByTitle(title)) {
      throw new ConflictDomainException('Book with this title already exists');
    }

    const authorId = await this.resolveAuthorId(command);
    const genreIds = await this.resolveGenreIds(command.genres);
    const book = Book.create({
      id: BookId.create(this.idGenerator.generate()),
      title: command.title,
      authorId,
      genres: genreIds,
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
  }

  private async resolveAuthorId(command: CreateBookCommand): Promise<string> {
    let authorId = command.authorId;
    if (!command.authorName || (authorId && !authorId.startsWith('new:'))) {
      return authorId ?? '';
    }

    const authorName = AuthorName.create(command.authorName);
    const existing = await this.authorRepository.findByName(authorName);
    if (existing) return existing.id.toString();

    const author = AuthorEntity.create({
      id: AuthorId.create(this.idGenerator.generate()),
      name: command.authorName,
      bio: '',
      photoUrl: '',
    });
    await this.authorRepository.save(author);
    authorId = author.id.toString();
    return authorId;
  }

  private async resolveGenreIds(genreIdsOrNames: string[]): Promise<string[]> {
    const genreIds: string[] = [];
    for (const idOrName of genreIdsOrNames) {
      if (!idOrName.startsWith('new:')) {
        genreIds.push(idOrName);
        continue;
      }

      const name = idOrName.replace('new:', '');
      const genreName = GenreName.create(name);
      const existing = await this.genreRepository.findByName(genreName);
      if (existing) {
        genreIds.push(existing.id.toString());
        continue;
      }

      const genre = GenreEntity.create({
        id: GenreId.create(this.idGenerator.generate()),
        name,
      });
      await this.genreRepository.save(genre);
      genreIds.push(genre.id.toString());
    }
    return genreIds;
  }
}
