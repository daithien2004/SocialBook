export interface ChapterSummaryReadModel {
  id: string;
  title: string;
  slug: string;
  orderIndex: number;
  viewsCount: number;
  paragraphsCount: number;
  createdAt: Date;
  updatedAt: Date;
  ttsStatus?: 'completed';
  audioUrl?: string | null;
}

export interface ChapterBookReadModel {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  authorId: string;
}

export interface ChapterListReadModel {
  book: ChapterBookReadModel;
  chapters: ChapterSummaryReadModel[];
  total: number;
}
