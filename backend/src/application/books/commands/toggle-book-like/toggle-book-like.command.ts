import { Command } from '@nestjs/cqrs';
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { BookId } from "@/domain/books/value-objects/book-id.vo";
import { TargetType } from "@/domain/likes/value-objects/target-type.vo";
import { IBookCachePort } from "@/domain/books/interfaces/book-cache.port";
import { ToggleLikeCommand } from "@/application/likes/commands/toggle-like/toggle-like.command";
import { ToggleBookLikeResult } from "@/application/books/commands/toggle-book-like/toggle-book-like.handler";

export class ToggleBookLikeCommand extends Command<ToggleBookLikeResult> {
  public readonly bookId: string;
  public readonly userId: string;
  public readonly bookSlug: string;

  constructor(props: { bookId: string; userId: string; bookSlug: string }) { super(); 
    this.bookId = props.bookId;
    this.userId = props.userId;
    this.bookSlug = props.bookSlug;
  }
}
