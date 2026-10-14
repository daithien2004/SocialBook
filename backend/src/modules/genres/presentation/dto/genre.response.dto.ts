import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GenreReadModel } from '../../application/read-models/genre.read-model';

export class GenreResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromReadModel(model: GenreReadModel): GenreResponseDto {
    const dto = new GenreResponseDto();
    dto.id = model.id;
    dto.name = model.name;
    dto.slug = model.slug;
    dto.description = model.description;
    dto.createdAt = model.createdAt;
    dto.updatedAt = model.updatedAt;
    return dto;
  }

  static fromArray(models: GenreReadModel[]): GenreResponseDto[] {
    return models.map((model) => GenreResponseDto.fromReadModel(model));
  }
}
