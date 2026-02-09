import { Author as AuthorEntity } from '@/domain/authors/entities/author.entity';
import { AuthorDocument } from '@/infrastructure/database/schemas/author.schema';

interface AuthorPersistence {
  name: string;
  slug: string;
  bio: string;
  photoUrl: string;
  updatedAt: Date;
}

export class AuthorMapper {
  static toDomain(document: AuthorDocument | any): AuthorEntity {
    return AuthorEntity.reconstitute({
      id: document._id.toString(),
      name: document.name,
      slug: document.slug || AuthorMapper.generateSlug(document.name),
      bio: document.bio || '',
      photoUrl: document.photoUrl || '',
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  static toPersistence(author: AuthorEntity): AuthorPersistence {
    return {
      name: author.name.toString(),
      slug: author.slug,
      bio: author.bio,
      photoUrl: author.photoUrl,
      updatedAt: author.updatedAt,
    };
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
