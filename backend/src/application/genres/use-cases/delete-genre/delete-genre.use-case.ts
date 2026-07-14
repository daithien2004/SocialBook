import { Injectable } from '@nestjs/common';
import {
  NotFoundDomainException,
  ConflictDomainException,
} from '@/shared/domain/common-exceptions';
import { IGenreRepository } from '@/domain/genres/repositories/genre.repository.interface';
import { GenreId } from '@/domain/genres/value-objects/genre-id.vo';
import { DeleteGenreCommand } from './delete-genre.command';
import { ErrorMessages } from '@/common/constants/error-messages';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';

@Injectable()
export class DeleteGenreUseCase {
  constructor(
    private readonly genreRepository: IGenreRepository,
    private readonly bookRepository: IBookRepository,
  ) {}

  async execute(command: DeleteGenreCommand): Promise<void> {
    const genreId = GenreId.create(command.id);
    const genre = await this.genreRepository.findById(genreId);

    if (!genre) {
      throw new NotFoundDomainException(
        ErrorMessages.GENRE_NOT_FOUND || 'Genre not found',
      );
    }

    const booksCount = await this.bookRepository.countByGenre(
      genreId.toString(),
    );

    if (booksCount > 0) {
      throw new ConflictDomainException(
        `Không thể xóa thể loại này vì có ${booksCount} sách đang sử dụng`,
      );
    }

    await this.genreRepository.delete(genreId);
  }
}
