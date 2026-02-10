import { Book as BookEntity } from '@/domain/books/entities/book.entity';
import { BookDetailReadModel } from '@/domain/books/read-models/book-detail.read-model';
import { BookListReadModel } from '@/domain/books/read-models/book-list.read-model';
import { Types } from 'mongoose';
import { BookPersistence, RawBookDetailAggregation, RawBookDocument, RawGenre } from './book.raw-types';

export class BookMapper {
  static toDomain(document: RawBookDocument): BookEntity {
    const genres = (document.genres || []).map((g) => {
      if (typeof g === 'object' && 'name' in g) return (g as RawGenre)._id.toString();
      return g.toString();
    });

    return BookEntity.reconstitute({
      id: document._id.toString(),
      title: document.title,
      slug: document.slug,
      authorId: document.authorId.toString(),
      genres,
      description: document.description || '',
      publishedYear: document.publishedYear || '',
      coverUrl: document.coverUrl || '',
      status: (document.status as 'draft' | 'published' | 'completed') || 'draft',
      tags: document.tags || [],
      views: document.views || 0,
      likes: document.likes || 0,
      likedBy: (document.likedBy || []).map((id) => id.toString()),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  static toListReadModel(document: RawBookDocument): BookListReadModel {
    return {
      id: document._id.toString(),
      title: document.title,
      slug: document.slug,
      authorId: document.authorId.toString(),
      genres: (document.genres || [])
        .filter((g): g is RawGenre => typeof g === 'object' && 'name' in g)
        .map((g) => ({
          id: g._id.toString(),
          name: g.name,
          slug: g.slug,
        })),
      description: document.description || '',
      publishedYear: document.publishedYear || '',
      coverUrl: document.coverUrl || '',
      status: document.status || 'draft',
      tags: document.tags || [],
      views: document.views || 0,
      likes: document.likes || 0,
      likedBy: (document.likedBy || []).map((id) => id.toString()),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  static toPersistence(book: BookEntity): BookPersistence {
    return {
      title: book.title.toString(),
      slug: book.slug,
      authorId: new Types.ObjectId(book.authorId.toString()),
      genres: book.genres.map(genre => new Types.ObjectId(genre.toString())),
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

  static toDetailReadModel(doc: RawBookDetailAggregation): BookDetailReadModel {
    return {
      id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      authorId: doc.authorId?.toString() || '',
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
      views: doc.views || 0,
      likes: doc.likes || 0,
      likedBy: (doc.likedBy || []).map((id) => id.toString()),
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
