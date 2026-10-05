import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { getErrorMessage } from "@/common/utils/error.util";
import { Injectable, Logger } from "@nestjs/common";
import { IAuthorRepository } from "@/domain/authors/repositories/author.repository.interface";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { IVectorRepository } from "@/domain/chroma/repositories/vector.repository.interface";
import { VectorDocument } from "@/domain/chroma/entities/vector-document.entity";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";

import { ReindexResult } from '@/application/chroma/commands/reindex-all/reindex-all.handler';

export class ReindexAllCommand extends Command<ReindexResult> {
  constructor() { super(); }
}
