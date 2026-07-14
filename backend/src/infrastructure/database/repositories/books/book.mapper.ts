import { Book as BookEntity } from '@/domain/books/entities/book.entity';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { BookListReadModel } from '@/domain/books/read-models/book-list.read-model';
import { Types } from 'mongoose';
export interface BookPersistence {
  title: string;
  slug: string;
  authorId: Types.ObjectId;
  genres: Types.ObjectId[];
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

export interface RawGenre {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

export interface RawParagraph {
  _id: Types.ObjectId;
  content: string;
}

export interface RawChapter {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  paragraphs: RawParagraph[];
  orderIndex: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RawBookDocument {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  authorId: Types.ObjectId | { _id: Types.ObjectId; name: string };
  genres: (Types.ObjectId | RawGenre)[];
  description?: string;
  publishedYear?: string;
  coverUrl?: string;
  status?: string;
  tags?: string[];
  views?: number;
  likes?: number;
  likedBy?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  chapterCount?: number;
}

export interface RawBookDetailAggregation
  extends Omit<RawBookDocument, 'genres'> {
  genres: Types.ObjectId[];
  genreDetails: RawGenre[];
  chapters: RawChapter[];
  authorName?: string;
}

type PopulatedAuthor = { _id: Types.ObjectId; name: string };

function isPopulatedAuthor(field: unknown): field is PopulatedAuthor {
  return (
    typeof field === 'object' &&
    field !== null &&
    '_id' in field &&
    'name' in field
  );
}

export class BookMapper {
  private static getAuthorIdString(
    authorId: Types.ObjectId | { _id: Types.ObjectId; name: string },
  ): string {
    return isPopulatedAuthor(authorId)
      ? authorId._id.toString()
      : (authorId.toString() ?? '');
  }

  static toDomain(document: RawBookDocument): BookEntity {
    const genres = (document.genres || []).map((g) => {
      if (typeof g === 'object' && 'name' in g) return g._id.toString();
      return g.toString();
    });

    const authorName = isPopulatedAuthor(document.authorId)
      ? document.authorId.name
      : undefined;
    const authorIdStr = BookMapper.getAuthorIdString(document.authorId);

    return BookEntity.reconstitute({
      id: document._id.toString(),
      title: document.title,
      slug: document.slug,
      authorId: authorIdStr,
      genres,
      description: document.description || '',
      publishedYear: document.publishedYear || '',
      coverUrl: document.coverUrl || '',
      status:
        (document.status as 'draft' | 'published' | 'completed') || 'draft',
      tags: document.tags || [],
      views: document.views || 0,
      likes: document.likes || 0,
      likedBy: (document.likedBy || []).map((id) => id.toString()),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      authorName,
      genreObjects: (document.genres || [])
        .filter((g): g is RawGenre => typeof g === 'object' && 'name' in g)
        .map((g) => ({
          id: g._id.toString(),
          name: g.name,
          slug: g.slug,
        })),
    });
  }

  static toListReadModel(document: RawBookDocument): BookListReadModel {
    const authorName = isPopulatedAuthor(document.authorId)
      ? document.authorId.name
      : undefined;
    const authorIdStr = BookMapper.getAuthorIdString(document.authorId);

    return {
      id: document._id.toString(),
      title: document.title,
      slug: document.slug,
      authorId: authorIdStr,
      authorName,
      genres: ((document.genres as RawGenre[]) || []).map((g) => ({
        id: g._id.toString(),
        name: g.name,
        slug: g.slug,
      })),
      description: document.description || '',
      publishedYear: document.publishedYear || '',
      coverUrl: document.coverUrl || '',
      status: document.status || 'draft',
      tags: document.tags || [],
      likedBy: (document.likedBy || []).map((id) => id.toString()),
      stats: {
        views: document.views || 0,
        likes: document.likes || 0,
        chapterCount: document.chapterCount ?? 0,
      },
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      chapterCount: document.chapterCount || 0,
    };
  }
  static toPersistence(book: BookEntity): BookPersistence {
    return {
      title: book.title.toString(),
      slug: book.slug,
      authorId: new Types.ObjectId(book.authorId.toString()),
      genres: book.genres.map((genre) => new Types.ObjectId(genre.toString())),
      description: book.description,
      publishedYear: book.publishedYear,
      coverUrl: book.coverUrl,
      status: book.status.toString(),
      tags: book.tags,
      views: book.views,
      likes: book.likes,
      likedBy: book.likedBy.map((id) => new Types.ObjectId(id)),
      updatedAt: book.updatedAt,
    };
  }

  static toDetailReadModel(doc: RawBookDetailAggregation): BookDetailReadModel {
    return {
      id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      authorId: BookMapper.getAuthorIdString(doc.authorId),
      authorName: doc.authorName,
      genres: (doc.genreDetails || []).map((g) => ({
        id: g._id.toString(),
        name: g.name,
        slug: g.slug,
      })),
      description: doc.description || '',
      publishedYear: doc.publishedYear || '',
      coverUrl: doc.coverUrl || '',
      status: doc.status || 'draft',
      tags: doc.tags || [],
      likedBy: (doc.likedBy || []).map((id) => id.toString()),
      stats: {
        views: doc.views || 0,
        likes: doc.likes || 0,
        chapterCount: (doc.chapters || []).length,
        averageRating: 0,
        totalRatings: 0,
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      chapters: (doc.chapters || []).map((ch) => ({
        id: ch._id.toString(),
        title: ch.title,
        slug: ch.slug,
        content: (ch.paragraphs || []).map((p) => p.content).join('\n'),
        orderIndex: ch.orderIndex,
        viewsCount: ch.viewsCount || 0,
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
      })),
    };
  }
}
