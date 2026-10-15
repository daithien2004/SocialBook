export interface UserHighlightReadModel {
  id: string;
  userId: string;
  bookId: string;
  chapterId: string;
  paragraphId: string;
  content: string;
  color: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}
