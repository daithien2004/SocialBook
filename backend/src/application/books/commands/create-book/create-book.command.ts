import { Command } from '@nestjs/cqrs';
import { EventNames } from "@/common/constants/event-names.constant";
import { ConflictDomainException } from "@/shared/domain/common-exceptions";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { IAuthorRepository } from "@/domain/authors/repositories/author.repository.interface";
import { IGenreRepository } from "@/domain/genres/repositories/genre.repository.interface";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";
import { Book } from "@/domain/books/entities/book.entity";
import { BookId } from "@/domain/books/value-objects/book-id.vo";
import { BookTitle } from "@/domain/books/value-objects/book-title.vo";
import { IBookCachePort } from "@/domain/books/interfaces/book-cache.port";
import { Author } from "@/domain/authors/entities/author.entity";
import { AuthorId } from "@/domain/authors/value-objects/author-id.vo";
import { AuthorName } from "@/domain/authors/value-objects/author-name.vo";
import { Genre } from "@/domain/genres/entities/genre.entity";
import { GenreId } from "@/domain/genres/value-objects/genre-id.vo";
import { GenreName } from "@/domain/genres/value-objects/genre-name.vo";

export class CreateBookCommand extends Command<Book> {
  public readonly title: string;
  public readonly authorId: string;
  public readonly authorName?: string;
  public readonly genres: string[];
  public readonly description?: string;
  public readonly publishedYear?: string;
  public readonly coverUrl?: string;
  public readonly status?: 'draft' | 'published' | 'completed';
  public readonly tags?: string[];

  constructor(props: {
    title: string;
    authorId: string;
    authorName?: string;
    genres: string[];
    description?: string;
    publishedYear?: string;
    coverUrl?: string;
    status?: 'draft' | 'published' | 'completed';
    tags?: string[];
  }) { super(); 
    this.title = props.title;
    this.authorId = props.authorId;
    this.authorName = props.authorName;
    this.genres = props.genres;
    this.description = props.description;
    this.publishedYear = props.publishedYear;
    this.coverUrl = props.coverUrl;
    this.status = props.status;
    this.tags = props.tags;
  }
}
