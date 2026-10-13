import {
  Genre as PrismaGenre,
  Prisma,
} from '@/core/database/generated/prisma/client';
import { Genre as GenreEntity } from '@/modules/genres/domain/entities/genre.entity';

export class GenreMapper {
  static toDomain(row: PrismaGenre): GenreEntity {
    return GenreEntity.reconstitute({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(entity: GenreEntity): Prisma.GenreUncheckedCreateInput {
    return {
      id: entity.id.toString(),
      name: entity.name.toString(),
      slug: entity.slug,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
