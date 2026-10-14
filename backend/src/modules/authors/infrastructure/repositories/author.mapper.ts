import { Author as PrismaAuthor } from '@/core/database/generated/prisma/client';
import { Author } from '@/modules/authors/domain/entities/author.entity';

export class AuthorMapper {
  static toDomain(row: PrismaAuthor): Author {
    return Author.reconstitute({
      id: row.id,
      name: row.name,
      slug: row.slug,
      bio: row.bio,
      photoUrl: row.photoUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(author: Author): {
    id: string;
    name: string;
    slug: string;
    bio: string;
    photoUrl: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: author.id.toString(),
      name: author.name.toString(),
      slug: author.slug,
      bio: author.bio,
      photoUrl: author.photoUrl,
      createdAt: author.createdAt,
      updatedAt: author.updatedAt,
    };
  }
}
