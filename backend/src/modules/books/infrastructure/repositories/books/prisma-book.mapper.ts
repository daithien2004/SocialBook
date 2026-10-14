import { Prisma } from '@/core/database/generated/prisma/client';
import { Book as BookEntity } from '@/modules/books/domain/books/entities/book.entity';
import { BookDetailReadModel } from '@/modules/books/application/read-models/book-detail.read-model';
import { BookListReadModel } from '@/modules/books/application/read-models/book-list.read-model';

export const BOOK_WITH_RELATIONS = {
  author: true,
  genres: { include: { genre: true } },
  likesByUser: { select: { userId: true } },
  _count: { select: { chapters: { where: { isDeleted: false } } } },
} satisfies Prisma.BookInclude;

export type BookWithRelations = Prisma.BookGetPayload<{
  include: typeof BOOK_WITH_RELATIONS;
}>;

function toStatus(status: string): 'draft' | 'published' | 'completed' {
  switch (status) {
    case 'published':
    case 'completed':
      return status;
    default:
      return 'draft';
  }
}

function toListReadModel(row: BookWithRelations): BookListReadModel {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    authorId: row.authorId,
    authorName: row.author.name,
    genres: row.genres.map(({ genre }) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
    })),
    description: row.description,
    publishedYear: row.publishedYear,
    coverUrl: row.coverUrl,
    status: row.status,
    tags: row.tags,
    likedBy: row.likesByUser.map(({ userId }) => userId),
    stats: {
      views: row.views,
      likes: row.likes,
      chapterCount: row._count.chapters,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    chapterCount: row._count.chapters,
  };
}

export const PrismaBookMapper = {
  toDomain(row: BookWithRelations): BookEntity {
    return BookEntity.reconstitute({
      id: row.id,
      title: row.title,
      slug: row.slug,
      authorId: row.authorId,
      genres: row.genres.map(({ genreId }) => genreId),
      description: row.description,
      publishedYear: row.publishedYear,
      coverUrl: row.coverUrl,
      status: toStatus(row.status),
      tags: row.tags,
      views: row.views,
      likes: row.likes,
      likedBy: row.likesByUser.map(({ userId }) => userId),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      genreObjects: row.genres.map(({ genre }) => ({
        id: genre.id,
        name: genre.name,
        slug: genre.slug,
      })),
      authorName: row.author.name,
      author: { id: row.author.id, name: row.author.name },
      chapterCount: row._count.chapters,
      vectorIndexedAt: row.vectorIndexedAt,
      version: row.version,
    });
  },

  toListReadModel,

  toDetailReadModel(
    row: BookWithRelations & {
      chapters: Array<{
        id: string;
        title: string;
        slug: string;
        orderIndex: number;
        viewsCount: number;
        createdAt: Date;
        updatedAt: Date;
      }>;
    },
  ): BookDetailReadModel {
    const list = toListReadModel(row);
    return {
      ...list,
      stats: {
        ...list.stats,
        averageRating: 0,
        totalRatings: 0,
      },
      chapters: row.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        slug: chapter.slug,
        content: '',
        orderIndex: chapter.orderIndex,
        viewsCount: chapter.viewsCount,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      })),
    };
  },

  persistenceData(entity: BookEntity): Prisma.BookUncheckedCreateInput {
    return {
      id: entity.id.toString(),
      authorId: entity.authorId.toString(),
      title: entity.title.toString(),
      slug: entity.slug,
      publishedYear: entity.publishedYear,
      description: entity.description,
      coverUrl: entity.coverUrl,
      status: entity.status.toString(),
      tags: entity.tags,
      views: entity.views,
      likes: entity.likes,
      vectorIndexedAt: entity.vectorIndexedAt,
      version: entity.loadedVersion,
      updatedAt: entity.updatedAt,
      genres: {
        create: entity.genres.map((genre) => ({ genreId: genre.toString() })),
      },
      likesByUser: {
        create: entity.likedBy.map((userId) => ({ userId })),
      },
    };
  },
};
