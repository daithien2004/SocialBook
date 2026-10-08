import { Command } from '@nestjs/cqrs';
import { Book } from '@/modules/books/domain/books/entities/book.entity';

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
  }) {
    super();
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
