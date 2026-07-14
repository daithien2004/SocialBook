import { Chapter } from '@/domain/chapters/entities/chapter.entity';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';

interface ChapterFactoryOverrides {
  id?: string;
  title?: string;
  slug?: string;
  bookId?: string;
  paragraphs?: Array<{ id: string; content: string }>;
  viewsCount?: number;
  orderIndex?: number;
  createdAt?: Date;
  updatedAt?: Date;
  ttsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
}

export function createChapterEntity(
  overrides: ChapterFactoryOverrides = {},
): Chapter {
  const {
    id = 'chapter-1',
    title = 'Chương 1: Khởi đầu',
    slug = 'chuong-1-khoi-dau',
    bookId = 'book-1',
    paragraphs = [
      { id: 'para-1', content: 'Đây là đoạn văn đầu tiên.' },
      { id: 'para-2', content: 'Đây là đoạn văn thứ hai.' },
    ],
    viewsCount = 50,
    orderIndex = 1,
    createdAt = new Date('2025-01-01'),
    updatedAt = new Date('2025-01-15'),
    ttsStatus,
    audioUrl,
  } = overrides;

  return Chapter.reconstitute({
    id,
    title,
    slug,
    bookId,
    paragraphs,
    viewsCount,
    orderIndex,
    createdAt,
    updatedAt,
    ...(ttsStatus && { ttsStatus }),
    ...(audioUrl && { audioUrl }),
  });
}

export function createChapterId(value: string = 'chapter-1'): ChapterId {
  return ChapterId.create(value);
}
