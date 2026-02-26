import { Chapter as ChapterEntity } from '@/domain/chapters/entities/chapter.entity';
import { Types } from 'mongoose';
import { RawParagraph } from '../books/book.raw-types';

export type RawParagraphDocument = RawParagraph;

export interface RawChapterDocument {
  _id: Types.ObjectId;
  bookId: Types.ObjectId;
  title: string;
  slug: string;
  paragraphs: RawParagraphDocument[];
  viewsCount: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RawChapterPersistence {
  title: string;
  slug: string;
  bookId: Types.ObjectId;
  paragraphs: Array<Pick<RawParagraph, 'content'>>;
  viewsCount: number;
  orderIndex: number;
  updatedAt: Date | undefined;
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
        content: p.content
      })),
      viewsCount: document.viewsCount || 0,
      orderIndex: document.orderIndex || 0,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  static toPersistence(chapter: ChapterEntity): RawChapterPersistence {
    return {
      title: chapter.title.toString(),
      slug: chapter.slug,
      bookId: new Types.ObjectId(chapter.bookId.toString()),
      paragraphs: chapter.paragraphs.map((p) => ({
        content: p.content
      })),
      viewsCount: chapter.viewsCount,
      orderIndex: chapter.orderIndex.getValue(),
      updatedAt: chapter.updatedAt,
    };
  }
}
