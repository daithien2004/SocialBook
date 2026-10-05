import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { IUserHighlightRepository } from "@/domain/user-highlights/repositories/user-highlight.repository.interface";
import { UserHighlight } from "@/domain/user-highlights/entities/user-highlight.entity";

export class CreateUserHighlightCommand extends Command<UserHighlight> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly paragraphId: string,
    public readonly content: string,
    public readonly color?: string,
    public readonly note?: string,
  ) { super(); }
}