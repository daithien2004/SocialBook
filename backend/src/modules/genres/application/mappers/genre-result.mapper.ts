import { Genre } from '@/modules/genres/domain/entities/genre.entity';
import type { GenreReadModel } from '../read-models/genre.read-model';

export class GenreResultMapper {
  static toReadModel(genre: Genre): GenreReadModel {
    return {
      id: genre.id.toString(),
      name: genre.name.toString(),
      slug: genre.slug,
      description: genre.description,
      createdAt: genre.createdAt,
      updatedAt: genre.updatedAt,
    };
  }
}
