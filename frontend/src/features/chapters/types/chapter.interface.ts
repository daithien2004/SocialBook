import { Book } from "../../books/types/book.interface";

export interface Paragraph {
  id: string;
  content: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  slug: string;
  orderIndex: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  paragraphs: Paragraph[];
  paragraphsCount?: number;
  ttsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
}

export interface GetChapterParams {
  bookSlug: string;
  chapterSlug: string;
}

export interface GetChaptersParams {
  bookSlug: string;
}

export interface GetChapterByIdParams {
  bookSlug: string;
  chapterId: string;
}

export interface CreateChapterParams {
  bookSlug: string;
  data: {
    title: string;
    paragraphs: { id: string; content: string }[];
    slug?: string;
  };
}

export interface UpdateChapterParams {
  bookSlug: string;
  chapterId: string;
  data: {
    title?: string;
    paragraphs?: { id: string; content: string }[];
    slug?: string;
  };
}

export interface DeleteChapterParams {
  bookSlug: string;
  chapterId: string;
}

export interface ImportChaptersParams {
  bookSlug: string;
  formData: FormData;
}

export interface ChapterDetailData {
  book: Book;
  chapter: Chapter;
  navigation: {
    previous: ChapterNavigation | null;
    next: ChapterNavigation | null;
  };
}

export interface ChapterNavigation {
  id: string;
  title: string;
  slug: string;
  orderIndex: number;
}

export interface ChaptersListData {
  book: Partial<Book>;
  chapters: Chapter[];
  total: number;
}

export interface ChapterPreview {
  title: string;
  content: string;
}