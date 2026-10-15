import { Prisma } from '@/core/database/generated/prisma/client';
import {
  ReadingList,
  ReadingStatus,
} from '@/modules/library/domain/library/entities/reading-list.entity';
import { LibraryItemReadModel } from '@/modules/library/application/read-models/library-item.read-model';

export const READING_LIST_WITH_RELATIONS = {
  collections: { select: { collectionId: true } },
} satisfies Prisma.ReadingListInclude;

export const LIBRARY_ITEM_WITH_RELATIONS = {
  book: {
    select: {
      id: true,
      title: true,
      slug: true,
      coverUrl: true,
      author: { select: { name: true } },
    },
  },
  lastReadChapter: {
    select: { id: true, title: true, slug: true, orderIndex: true },
  },
  collections: { select: { collectionId: true } },
} satisfies Prisma.ReadingListInclude;

export type ReadingListWithRelations = Prisma.ReadingListGetPayload<{
  include: typeof READING_LIST_WITH_RELATIONS;
}>;

export type LibraryItemWithRelations = Prisma.ReadingListGetPayload<{
  include: typeof LIBRARY_ITEM_WITH_RELATIONS;
}>;

export function toReadingListDomain(
  row: ReadingListWithRelations,
): ReadingList {
  return ReadingList.reconstitute({
    id: row.id,
    userId: row.userId,
    bookId: row.bookId,
    status: requireReadingStatus(row.status),
    lastReadChapterId: row.lastReadChapterId,
    collectionIds: row.collections.map(({ collectionId }) => collectionId),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toLibraryItemReadModel(
  row: LibraryItemWithRelations,
): LibraryItemReadModel {
  return {
    id: row.id,
    userId: row.userId,
    bookId: {
      id: row.book.id,
      title: row.book.title,
      slug: row.book.slug,
      coverUrl: row.book.coverUrl,
      authorName: row.book.author.name,
    },
    status: requireReadingStatus(row.status),
    lastReadChapterId: row.lastReadChapter
      ? {
          id: row.lastReadChapter.id,
          title: row.lastReadChapter.title,
          slug: row.lastReadChapter.slug,
          orderIndex: row.lastReadChapter.orderIndex,
        }
      : null,
    collectionIds: row.collections.map(({ collectionId }) => collectionId),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function requireReadingStatus(value: string): ReadingStatus {
  if (value === 'READING') return ReadingStatus.READING;
  if (value === 'COMPLETED') return ReadingStatus.COMPLETED;
  if (value === 'ARCHIVED') return ReadingStatus.ARCHIVED;
  if (value === 'NONE') return ReadingStatus.NONE;
  throw new Error(`Invalid persisted reading status: ${value}`);
}
