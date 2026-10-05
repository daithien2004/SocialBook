import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { IBookCachePort } from "@/domain/books/interfaces/book-cache.port";
import { IViewRankingCachePort } from "@/domain/books/interfaces/view-ranking-cache.port";
import { ErrorMessages } from "@/common/constants/error-messages";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { Injectable, Logger } from "@nestjs/common";

export class RecordBookViewCommand extends Command<void> {
  public readonly slug: string;

  constructor(slug: string) { super(); 
    this.slug = slug;
  }
}
