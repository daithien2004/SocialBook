import { Chapter as ChapterEntity } from '@/modules/chapters/domain/chapters/entities/chapter.entity';
import { Types } from 'mongoose';
import { RawParagraph } from '@/modules/books/infrastructure/repositories/books/public-api';

export interface RawChapterDocument {
  _id: Types.ObjectId;
  bookId: Types.ObjectId;
  title: string;
  slug: string;
  paragraphs: RawParagraph[];
  viewsCount: number;
  orderIndex: number;
  version?: number;
  createdAt: Date;
  updatedAt: Date;
  ttsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
}

export interface RawChapterPersistence {
  title: string;
  slug: string;
  bookId: Types.ObjectId;
  paragraphs: RawParagraph[];
  viewsCount: number;
  orderIndex: number;
  version: number;
  updatedAt: Date | undefined;
  ttsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
}

export class ChapterMapper {
  static toDomain(document: RawChapterDocument): ChapterEntity {
    return ChapterEntity.reconstitute({
      id: document._id.toString(),
      title: document.title,
      slug: document.slug,
      bookId: document.bookId?.toString() || '',
      paragraphs: (document.paragraphs || []).map((p) => ({
        id: p._id?.toString(),
        content: p.content,
      })),
      viewsCount: document.viewsCount || 0,
      orderIndex: document.orderIndex || 0,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      version: document.version,
      ttsStatus: document.ttsStatus,
      audioUrl: document.audioUrl,
    });
  }

  static toPersistence(chapter: ChapterEntity): RawChapterPersistence {
    return {
      title: chapter.title.toString(),
      slug: chapter.slug,
      bookId: new Types.ObjectId(chapter.bookId.toString()),
      paragraphs: chapter.paragraphs.map((p) => ({
        _id: new Types.ObjectId(p.id),
        content: p.content,
      })),
      viewsCount: chapter.viewsCount,
      orderIndex: chapter.orderIndex.getValue(),
      updatedAt: chapter.updatedAt,
      version: chapter.loadedVersion,
      ttsStatus: chapter.ttsStatus,
      audioUrl: chapter.audioUrl,
    };
  }
}
