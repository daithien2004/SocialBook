import { Injectable } from '@nestjs/common';
import {
  ConflictDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { GenreErrorMessages } from '@/modules/genres/application/error-messages';
import { IBookRepository } from '@/modules/books/domain/public-api';
import { PaginatedResult } from '@/shared/domain/pagination.types';
import { Genre } from '../domain/entities/genre.entity';
import { IGenreRepository } from '../domain/repositories/genre.repository.interface';
import { GenreId } from '../domain/value-objects/genre-id.vo';
import { GenreName } from '../domain/value-objects/genre-name.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

@Injectable()
export class GenresService {
  constructor(
    private readonly genreRepository: IGenreRepository,
    private readonly bookRepository: IBookRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async create(name: string, description?: string): Promise<Genre> {
    const genreName = GenreName.create(name);
    const exists = await this.genreRepository.existsByName(genreName);

    if (exists) {
      throw new ConflictDomainException(GenreErrorMessages.GENRE_EXISTS);
    }

    const genre = Genre.create({
      id: GenreId.create(this.idGenerator.generate()),
      name,
      description,
    });

    await this.genreRepository.save(genre);
    return genre;
  }

  async update(
    id: string,
    name?: string,
    description?: string,
  ): Promise<Genre> {
    const genreId = GenreId.create(id);
    const genre = await this.findById(id);

    if (name && name !== genre.name.toString()) {
      const genreName = GenreName.create(name);
      const exists = await this.genreRepository.existsByName(
        genreName,
        genreId,
      );

      if (exists) {
        throw new ConflictDomainException(GenreErrorMessages.GENRE_EXISTS);
      }

      genre.changeName(name);
    }

    if (description !== undefined) {
      genre.updateDescription(description);
    }

    await this.genreRepository.save(genre);
    return genre;
  }

  async delete(id: string): Promise<void> {
    const genreId = GenreId.create(id);
    await this.findById(id);

    const booksCount = await this.bookRepository.countByGenre(
      genreId.toString(),
    );

    if (booksCount > 0) {
      throw new ConflictDomainException(
        `Không thể xóa thể loại này vì có ${booksCount.toString()} sách đang sử dụng`,
      );
    }

    await this.genreRepository.delete(genreId);
  }

  async findById(id: string): Promise<Genre> {
    const genreId = GenreId.create(id);
    const genre = await this.genreRepository.findById(genreId);

    if (!genre) {
      throw new NotFoundDomainException(GenreErrorMessages.GENRE_NOT_FOUND);
    }

    return genre;
  }

  findAll(
    page: number,
    limit: number,
    name?: string,
  ): Promise<PaginatedResult<Genre>> {
    return this.genreRepository.findAll({ name }, { page, limit });
  }
}
