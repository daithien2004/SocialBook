import { Book as BookEntity } from '@/domain/books/entities/book.entity';
import { BookDocument } from '@/infrastructure/database/schemas/book.schema';
import { Types } from 'mongoose';

interface BookPersistence {
  title: string;
  slug: string;
  authorId: Types.ObjectId;
  genres: Types.ObjectId[];
  chapters: Types.ObjectId[];
  description: string;
  publishedYear: string;
  coverUrl: string;
  status: string;
  tags: string[];
  views: number;
  likes: number;
  likedBy: Types.ObjectId[];
  updatedAt: Date;
}

export class BookMapper {
  static toDomain(document: BookDocument | any): BookEntity {
    return BookEntity.reconstitute({
      id: document._id.toString(),
      title: document.title,
      slug: document.slug,
      authorId: (document.authorId && document.authorId._id ? document.authorId._id.toString() : document.authorId?.toString()) || '',
      genres: (document.genres || []).map((g: any) => (g && g._id ? g._id.toString() : g.toString())),
      // chapterIds removed
      description: document.description || '',
      publishedYear: document.publishedYear || '',
      coverUrl: document.coverUrl || '',
      status: document.status || 'draft',
      tags: document.tags || [],
      views: document.views || 0,
      likes: document.likes || 0,
      likedBy: (document.likedBy || []).map((id: any) => id.toString()),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      genreObjects: (document.genres || []).map((g: any) => {
        if (typeof g === 'object' && g._id) {
          return {
            id: g._id.toString(),
            name: g.name,
            slug: g.slug
          };
        }
        return null;
      }).filter((g: any) => g !== null),
      chapters: [], // Mapper cannot reliably reconstruct full Chapter entities from potentially partial/missing data.
    });
  }

  static toPersistence(book: BookEntity): BookPersistence {
    return {
      title: book.title.toString(),
      slug: book.slug,
      authorId: new Types.ObjectId(book.authorId.toString()),
      genres: book.genres.map(genre => new Types.ObjectId(genre.toString())),
      chapters: book.chapters.map(chapter => new Types.ObjectId(chapter.id.toString())),
      description: book.description,
      publishedYear: book.publishedYear,
      coverUrl: book.coverUrl,
      status: book.status.toString(),
      tags: book.tags,
      views: book.views,
      likes: book.likes,
      likedBy: book.likedBy.map(id => new Types.ObjectId(id)),
      updatedAt: book.updatedAt,
    };
  }
}
