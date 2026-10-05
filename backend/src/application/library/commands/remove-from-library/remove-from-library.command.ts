import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IReadingListRepository } from "@/domain/library/repositories/reading-list.repository.interface";
import { IReadingProgressRepository } from "@/domain/library/repositories/reading-progress.repository.interface";
import { UserId } from "@/domain/library/value-objects/user-id.vo";
import { BookId } from "@/domain/library/value-objects/book-id.vo";
import { ChapterId } from "@/domain/library/value-objects/chapter-id.vo";
import { Injectable } from "@nestjs/common";

export class RemoveFromLibraryCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) { super(); }
}
