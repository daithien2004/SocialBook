import { Injectable, Inject } from '@nestjs/common';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/domain/books/value-objects/book-title.vo';
import { CreateBookCommand } from './create-book.command';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';

@Injectable()
export class CreateBookUseCase {
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly idGenerator: IIdGenerator,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
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

    const book = Book.create({
      id: BookId.create(this.idGenerator.generate()),
      title: command.title,
      authorId: command.authorId,
      genres: command.genres,
      description: command.description,
      publishedYear: command.publishedYear,
      coverUrl: command.coverUrl,
      status: command.status,
      tags: command.tags,
    });

    await this.bookRepository.save(book);
    // cập nhật lại cache
    await this.cache.set(
      `books:detail:${book.id.toString()}`,
      {
        id: book.id.toString(),
        title: book.title.toString(),
        slug: book.slug,
        authorId: book.authorId.toString(),
        genres: book.genres.map((g) => g.toString()),
        description: book.description,
        publishedYear: book.publishedYear,
        coverUrl: book.coverUrl,
        status: book.status.toString(),
        tags: book.tags,
        views: book.views,
        likes: book.likes,
        likedBy: book.likedBy,
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        authorName: book.authorName,
        chapterCount: book.chapterCount,
      },
      this.CACHE_TTL,
    );

    return book;
  }
}
