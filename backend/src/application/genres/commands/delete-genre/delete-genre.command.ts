import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException, ConflictDomainException } from "@/shared/domain/common-exceptions";
import { IGenreRepository } from "@/domain/genres/repositories/genre.repository.interface";
import { GenreId } from "@/domain/genres/value-objects/genre-id.vo";
import { ErrorMessages } from "@/common/constants/error-messages";
import { IBookRepository } from "@/domain/books/repositories/book.repository.interface";

export class DeleteGenreCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();}
}
