import { Command } from '@nestjs/cqrs';
import { ToggleBookLikeResult } from '@/modules/books/application/books/commands/toggle-book-like/toggle-book-like.handler';
import type { Actor } from '@/shared/casl/actor';

export class ToggleBookLikeCommand extends Command<ToggleBookLikeResult> {
  public readonly actor: Actor;
  public readonly bookId: string;
  public readonly userId: string;
  public readonly bookSlug: string;

  constructor(props: {
    actor: Actor;
    bookId: string;
    userId: string;
    bookSlug: string;
  }) {
    super();
    this.actor = props.actor;
    this.bookId = props.bookId;
    this.userId = props.userId;
    this.bookSlug = props.bookSlug;
  }
}
