import { Transactional } from '@nestjs-cls/transactional';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { ForbiddenError } from '@casl/ability';
import { randomUUID } from 'node:crypto';
import { CreateAuthorCommand, FindAuthorByNameQuery } from '@/modules/authors';
import { BookOutboxPort } from '@/modules/books/application/public-api';
import { IBookRepository } from '@/modules/books/domain/books/repositories/book.repository.interface';
import { Book } from '@/modules/books/domain/books/entities/book.entity';
import { BookId } from '@/modules/books/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/modules/books/domain/books/value-objects/book-title.vo';
import { IBookCachePort } from '@/modules/books/domain/books/interfaces/book-cache.port';
import { CreateBookCommand } from './create-book.command';
import { CreateGenreCommand, FindGenreByNameQuery } from '@/modules/genres';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import {
  BadRequestDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IMediaPort } from '@/modules/media/domain/public-api';

@CommandHandler(CreateBookCommand)
export class CreateBookHandler implements ICommandHandler<
  CreateBookCommand,
  string
> {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly idGenerator: IIdGenerator,
    private readonly bookCache: IBookCachePort,
    private readonly bookOutbox: BookOutboxPort,
    private readonly media: IMediaPort,
  ) {}

  async execute(command: CreateBookCommand): Promise<string> {
    ForbiddenError.from(command.actor.ability).throwUnlessCan('create', 'Book');
    if (command.genres.length === 0) {
      throw new BadRequestDomainException('Book must have at least one genre');
    }
    if (command.genres.length > 5) {
      throw new BadRequestDomainException(
        'Book cannot have more than 5 genres',
      );
    }

    const coverUrl = command.coverFile
      ? await this.media.uploadImage(command.coverFile)
      : command.coverUrl;
    const book = await this.createBook(command, coverUrl);
    await this.bookCache.setDetail(book);
    return book.id.toString();
  }

  @Transactional()
  private async createBook(
    command: CreateBookCommand,
    coverUrl?: string,
  ): Promise<Book> {
    const title = BookTitle.create(command.title);
    if (await this.bookRepository.existsByTitle(title)) {
      throw new ConflictDomainException('Book with this title already exists');
    }

    const authorId = await this.resolveAuthorId(command);
    const genreIds = await this.resolveGenreIds(command);
    const book = Book.create({
      id: BookId.create(this.idGenerator.generate()),
      title: command.title,
      authorId,
      genres: genreIds,
      description: command.description,
      publishedYear: command.publishedYear,
      coverUrl,
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
    const authorId = command.authorId;
    if (!command.authorName || (authorId && !authorId.startsWith('new:'))) {
      return authorId ?? '';
    }

    const existing = await this.queryBus.execute(
      new FindAuthorByNameQuery(command.actor, command.authorName),
    );
    if (existing) return existing.id;

    return this.commandBus.execute(
      new CreateAuthorCommand(command.actor, command.authorName, '', ''),
    );
  }

  private async resolveGenreIds(command: CreateBookCommand): Promise<string[]> {
    const genreIds: string[] = [];
    for (const idOrName of command.genres) {
      if (!idOrName.startsWith('new:')) {
        genreIds.push(idOrName);
        continue;
      }

      const name = idOrName.replace('new:', '');
      const existing = await this.queryBus.execute(
        new FindGenreByNameQuery(command.actor, name),
      );
      if (existing) {
        genreIds.push(existing.id);
        continue;
      }

      const created = await this.commandBus.execute(
        new CreateGenreCommand(command.actor, name),
      );
      genreIds.push(created.id);
    }
    return genreIds;
  }
}
