import { Chapter as ChapterEntity } from '@/domain/chapters/entities/chapter.entity';
import { ChapterDocument } from '@/infrastructure/database/schemas/chapter.schema';
import { Types } from 'mongoose';

interface ChapterPersistence {
  title: string;
  slug: string;
  bookId: Types.ObjectId;
  paragraphs: Array<{ content: string }>;
  viewsCount: number;
  orderIndex: number;
  updatedAt: Date;
}

export class ChapterMapper {
  static toDomain(document: ChapterDocument | any): ChapterEntity {
    return ChapterEntity.reconstitute({
      id: document._id.toString(),
      title: document.title,
      slug: document.slug,
      bookId: document.bookId?.toString() || '',
      paragraphs: (document.paragraphs || []).map((p: any) => ({
        id: p._id?.toString() || p.id,
        content: p.content
      })),
      viewsCount: document.viewsCount || 0,
      orderIndex: document.orderIndex || 0,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  static toPersistence(chapter: ChapterEntity): ChapterPersistence {
    return {
      title: chapter.title.toString(),
      slug: chapter.slug,
      bookId: new Types.ObjectId(chapter.bookId.toString()),
      paragraphs: chapter.paragraphs.map(p => ({
        content: p.content
      })),
      viewsCount: chapter.viewsCount,
      orderIndex: chapter.orderIndex.getValue(),
      updatedAt: chapter.updatedAt,
    };
  }
}
