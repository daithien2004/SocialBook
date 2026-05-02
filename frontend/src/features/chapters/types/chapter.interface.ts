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
  page?: number;
  limit?: number;
}

export interface GetChapterByIdParams {
  bookSlug: string;
  chapterId: string;
}

export interface CreateChapterParams {
  bookSlug: string;
  data: {
    title: string;
    bookId: string;
    paragraphs: { id: string; content: string }[];
    slug?: string;
    orderIndex?: number;
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

// xử lí tác vụ chạy ngầm để import chương
export interface StartChaptersImportParams {
  bookSlug: string;
  data: {
    bookId: string;
    chapters: { title: string; content: string }[];
  };
}

export interface StartChaptersImportResponse {
  jobId: string;
}

export interface ChaptersImportFailure {
  title: string;
  reason: string;
}

export interface ChaptersImportResult {
  total: number;
  successful: number;
  failed: number;
  failures: ChaptersImportFailure[];
}

export interface ChaptersImportProgress {
  total: number;
  processed: number;
  currentTitle?: string;
  successful: number;
  failed: number;
}

export interface ChaptersImportStatus {
  state: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed' | 'paused' | 'unknown';
  progress: number | ChaptersImportProgress | null;
  result?: ChaptersImportResult;
  failedReason?: string;
}

export interface GetChaptersImportStatusParams {
  bookSlug: string;
  jobId: string;
}

export interface KnowledgeEntity {
  name: string;
  type: 'character' | 'location' | 'concept' | 'event' | 'vocabulary' | 'reference';
  description: string;
  importance: number;
}

export interface KnowledgeRelationship {
  source: string;
  target: string;
  type: string;
  description?: string;
}

export interface ChapterKnowledge {
  chapterId: string;
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  summary?: string;
}


export interface GetChapterKnowledgeParams {
  bookSlug: string;
  chapterId: string;
  force?: boolean;
}

