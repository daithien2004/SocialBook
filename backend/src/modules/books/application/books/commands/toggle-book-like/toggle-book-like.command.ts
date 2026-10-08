import { Command } from '@nestjs/cqrs';
import { ToggleBookLikeResult } from '@/modules/books/application/books/commands/toggle-book-like/toggle-book-like.handler';

export class ToggleBookLikeCommand extends Command<ToggleBookLikeResult> {
  public readonly bookId: string;
  public readonly userId: string;
  public readonly bookSlug: string;

  constructor(props: { bookId: string; userId: string; bookSlug: string }) {
    super();
    this.bookId = props.bookId;
    this.userId = props.userId;
    this.bookSlug = props.bookSlug;
  }
}
