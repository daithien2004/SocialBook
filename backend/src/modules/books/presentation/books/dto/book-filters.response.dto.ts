import { ApiProperty } from '@nestjs/swagger';
import type { BookFiltersReadModel } from '@/modules/books/application/read-models/book-filters.read-model';

class BookFilterGenreDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  count: number;

  constructor(source: BookFiltersReadModel['genres'][number]) {
    this.id = source.id;
    this.name = source.name;
    this.slug = source.slug;
    this.count = source.count;
  }
}

class BookFilterTagDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  count: number;

  constructor(source: BookFiltersReadModel['tags'][number]) {
    this.name = source.name;
    this.count = source.count;
  }
}

export class BookFiltersResponseDto {
  @ApiProperty({ type: BookFilterGenreDto, isArray: true })
  genres: BookFilterGenreDto[];

  @ApiProperty({ type: BookFilterTagDto, isArray: true })
  tags: BookFilterTagDto[];

  private constructor(source: BookFiltersReadModel) {
    this.genres = source.genres.map((genre) => new BookFilterGenreDto(genre));
    this.tags = source.tags.map((tag) => new BookFilterTagDto(tag));
  }

  static fromReadModel(source: BookFiltersReadModel): BookFiltersResponseDto {
    return new BookFiltersResponseDto(source);
  }
}
