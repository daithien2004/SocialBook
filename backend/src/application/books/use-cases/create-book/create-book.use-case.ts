import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { Book } from '@/domain/books/entities/book.entity';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { BookTitle } from '@/domain/books/value-objects/book-title.vo';
import { CreateBookCommand } from './create-book.command';

@Injectable()
export class CreateBookUseCase {
  constructor(
    private readonly bookRepository: IBookRepository,
    private readonly idGenerator: IIdGenerator
  ) { }

  async execute(command: CreateBookCommand): Promise<Book> {
    const title = BookTitle.create(command.title);

    // Check if book with same title already exists
    const exists = await this.bookRepository.existsByTitle(title);

    if (exists) {
      throw new ConflictException('Book with this title already exists');
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
      tags: command.tags
    });


    await this.bookRepository.save(book);

    return book;
  }
}


