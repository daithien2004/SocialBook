import { Genre as GenreEntity } from '@/domain/genres/entities/genre.entity';
import { GenreDocument } from '@/infrastructure/database/schemas/genre.schema';
import { Types } from 'mongoose';

interface GenrePersistence {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GenreMapper {
  static toDomain(doc: GenreDocument | any): GenreEntity {
    return GenreEntity.reconstitute({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description || '',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toPersistence(entity: GenreEntity): GenrePersistence {
    return {
      _id: new Types.ObjectId(entity.id.toString()),
      name: entity.name.toString(),
      slug: entity.slug,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
