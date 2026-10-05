import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from "@nestjs/common";
import { IBookmarkRepository } from "@/domain/bookmarks/repositories/bookmark.repository.interface";

export class DeleteBookmarkCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly paragraphId: string,
  ) { super(); }
}
