export interface ChapterParagraphReadModel {
  id: string;
  content: string;
}

export interface ChapterReadModel {
  id: string;
  title: string;
  slug: string;
  bookId: string;
  paragraphs: ChapterParagraphReadModel[];
  viewsCount: number;
  orderIndex: number;
  characterCount: number;
  contentPreview: string;
  createdAt: Date;
  updatedAt: Date;
}
