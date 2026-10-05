import { Query } from '@nestjs/cqrs';
import { IReadingListRepository } from "@/domain/library/repositories/reading-list.repository.interface";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { BookId } from "@/domain/books/value-objects/book-id.vo";
import { ReadingStatus } from "@/domain/library/enums/reading-status.enum";
import { IAIPort } from "@/domain/ai/interfaces/ai.port";
import { IGenreRepository } from "@/domain/genres/repositories/genre.repository.interface";

import { KnowledgeGraphResult } from '@/application/library/queries/get-knowledge-graph/get-knowledge-graph.handler';

export class GetKnowledgeGraphQuery extends Query<KnowledgeGraphResult> {
  constructor(public readonly userId: string) { super(); }
}
