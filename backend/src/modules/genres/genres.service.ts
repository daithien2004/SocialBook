import { ErrorMessages } from '@/src/common/constants/error-messages';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types, UpdateQuery } from 'mongoose';
import { BooksRepository } from '../../data-access/repositories/books.repository';
import { GenresRepository } from '../../data-access/repositories/genres.repository';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { GenreModal, GenreSelectModal } from './modals/genre.modal';
import { GenreDocument } from './schemas/genre.schema';

@Injectable()
export class GenresService {
  constructor(
    private readonly genresRepository: GenresRepository,
    private readonly booksRepository: BooksRepository,
  ) { }

  async findAll(query: Record<string, unknown>, current: number = 1, pageSize: number = 10) {
    const result = await this.genresRepository.findAll(query, current, pageSize);
    return {
      data: GenreModal.fromArray(result.data),
      meta: result.meta,
    };
  }

  async findAllSimple() {
    const genres = await this.genresRepository.findAllSimple();
    return GenreSelectModal.fromArray(genres);
  }

  async create(createGenreDto: CreateGenreDto) {
    if (!createGenreDto.name?.trim()) {
      throw new BadRequestException('Tên thể loại không được để trống');
    }

    const existingGenre = await this.genresRepository.existsByName(createGenreDto.name.trim());

    if (existingGenre) {
      throw new ConflictException(ErrorMessages.GENRE_EXISTS);
    }

    const newGenre = await this.genresRepository.create({
      name: createGenreDto.name.trim(),
      description: createGenreDto.description?.trim() || '',
    });
    return new GenreModal(newGenre);
  }

  async findOne(id: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const genre = await this.genresRepository.findById(id);

    if (!genre) {
      throw new NotFoundException(ErrorMessages.GENRE_NOT_FOUND);
    }

    return new GenreModal(genre);
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const existingGenre = await this.genresRepository.findById(id);

    if (!existingGenre) {
      throw new NotFoundException(ErrorMessages.GENRE_NOT_FOUND);
    }

    if (
      updateGenreDto.name?.trim() &&
      updateGenreDto.name.trim() !== existingGenre.name
    ) {
      const duplicateGenre = await this.genresRepository.existsByName(
        updateGenreDto.name.trim(),
        id
      );

      if (duplicateGenre) {
        throw new ConflictException(ErrorMessages.GENRE_EXISTS);
      }
    }

    const updateData: UpdateQuery<GenreDocument> = {};
    if (updateGenreDto.name?.trim()) updateData.name = updateGenreDto.name.trim();
    if (updateGenreDto.description !== undefined)
      updateData.description = updateGenreDto.description.trim();

    const updatedGenre = await this.genresRepository.update(id, updateData);

    if (!updatedGenre) {
      throw new InternalServerErrorException('Cập nhật thể loại thất bại');
    }

    return new GenreModal(updatedGenre);
  }

  async remove(id: string) {
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const genre = await this.genresRepository.findById(id);

    if (!genre) {
      throw new NotFoundException(ErrorMessages.GENRE_NOT_FOUND);
    }

    const booksCount = await this.booksRepository.countByGenre(id);

    if (booksCount > 0) {
      throw new ConflictException(
        `Không thể xóa thể loại này vì có ${booksCount} sách đang sử dụng`,
      );
    }

    await this.genresRepository.delete(id);

    return { success: true };
  }
}
