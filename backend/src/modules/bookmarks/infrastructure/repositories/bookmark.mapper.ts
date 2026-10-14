import { Bookmark as PrismaBookmark } from '@/core/database/generated/prisma/client';
import { Bookmark as BookmarkEntity } from '@/modules/bookmarks/domain/entities/bookmark.entity';

export class BookmarkPersistenceMapper {
  static toDomain(row: PrismaBookmark): BookmarkEntity {
    return BookmarkEntity.reconstitute({
      id: row.id,
      userId: row.userId,
      bookId: row.bookId,
      chapterId: row.chapterId,
      chapterSlug: row.chapterSlug,
      paragraphId: row.paragraphId,
      textPreview: row.textPreview,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toCreateInput(bookmark: BookmarkEntity) {
    return {
      id: bookmark.id,
      userId: bookmark.userId,
      bookId: bookmark.bookId,
      chapterId: bookmark.chapterId,
      chapterSlug: bookmark.chapterSlug,
      paragraphId: bookmark.paragraphId,
      textPreview: bookmark.textPreview,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
    };
  }
}
