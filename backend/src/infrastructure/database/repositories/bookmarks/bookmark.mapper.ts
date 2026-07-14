import { Bookmark as BookmarkEntity } from '@/domain/bookmarks/entities/bookmark.entity';
import { BookmarkDocument } from '@/infrastructure/database/schemas/bookmark.schema';
import { Types } from 'mongoose';

export class BookmarkMapper {
  static toDomain(doc: BookmarkDocument): BookmarkEntity {
    return BookmarkEntity.reconstitute({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      bookId: doc.bookId.toString(),
      chapterId: doc.chapterId.toString(),
      chapterSlug: doc.chapterSlug,
      paragraphId: doc.paragraphId,
      textPreview: doc.textPreview,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toPersistence(entity: BookmarkEntity): Record<string, unknown> {
    return {
      _id: new Types.ObjectId(entity.id),
      userId: new Types.ObjectId(entity.userId),
      bookId: new Types.ObjectId(entity.bookId),
      chapterId: new Types.ObjectId(entity.chapterId),
      chapterSlug: entity.chapterSlug,
      paragraphId: entity.paragraphId,
      textPreview: entity.textPreview,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
