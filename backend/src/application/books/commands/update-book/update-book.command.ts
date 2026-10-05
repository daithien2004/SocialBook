import { Command } from '@nestjs/cqrs';
import { NotFoundDomainException, ConflictDomainException } from "@/shared/domain/common-exceptions";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { Book } from "@/domain/books/entities/book.entity";
import { BookId } from "@/domain/books/value-objects/book-id.vo";
import { BookTitle } from "@/domain/books/value-objects/book-title.vo";
import { ErrorMessages } from "@/common/constants/error-messages";
import { IBookCachePort } from "@/domain/books/interfaces/book-cache.port";
import { EventNames } from "@/common/constants/event-names.constant";

export class UpdateBookCommand extends Command<Book> {
  public readonly id: string;
  public readonly title?: string;
  public readonly authorId?: string;
  public readonly genres?: string[];
  public readonly description?: string;
  public readonly publishedYear?: string;
  public readonly coverUrl?: string;
  public readonly status?: 'draft' | 'published' | 'completed';
  public readonly tags?: string[];

  constructor(props: {
    id: string;
    title?: string;
    authorId?: string;
    genres?: string[];
    description?: string;
    publishedYear?: string;
    coverUrl?: string;
    status?: 'draft' | 'published' | 'completed';
    tags?: string[];
  }) { super(); 
    this.id = props.id;
    this.title = props.title;
    this.authorId = props.authorId;
    this.genres = props.genres;
    this.description = props.description;
    this.publishedYear = props.publishedYear;
    this.coverUrl = props.coverUrl;
    this.status = props.status;
    this.tags = props.tags;
  }
}
