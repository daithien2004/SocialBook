import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from "@nestjs/common";
import { IVectorRepository } from "@/domain/chroma/repositories/vector.repository.interface";
import { IAIPort } from "@/domain/ai/interfaces/ai.port";
import { SearchQuery } from "@/domain/chroma/entities/search-query.entity";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { BookId } from "@/domain/books/value-objects/book-id.vo";

import { AskChatbotResult } from '@/application/chroma/commands/ask-chatbot/ask-chatbot.handler';

export class AskChatbotCommand extends Command<AskChatbotResult> {
  constructor(
    public readonly question: string,
  ) { super(); }
}
