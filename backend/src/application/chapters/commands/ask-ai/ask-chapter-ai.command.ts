import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { IAIPort } from "@/domain/ai/interfaces/ai.port";
import { getChapterContext } from "@/application/shared/utils/chapter-context-extractor";
import { ChapterId } from "@/domain/chapters/value-objects/chapter-id.vo";
import { Injectable, Logger } from "@nestjs/common";

export class AskChapterAICommand extends Command<{ answer: string; createdAt: Date; }> {
  constructor(
    public readonly chapterId: string,
    public readonly bookSlug: string,
    public readonly userId: string,
    public readonly question: string,
  ) { super(); }
}
