import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, ConflictException } from "@nestjs/common";
import { IBookmarkRepository } from "@/domain/bookmarks/repositories/bookmark.repository.interface";
import { Bookmark } from "@/domain/bookmarks/entities/bookmark.entity";
import { Types } from "mongoose";

export class CreateBookmarkCommand extends Command<Bookmark> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly chapterSlug: string,
    public readonly paragraphId: string,
    public readonly textPreview: string,
  ) { super(); }
}
