export interface CreateUserHighlightCommand {
  userId: string;
  bookId: string;
  chapterId: string;
  paragraphId: string;
  content: string;
  color?: string;
  note?: string;
}
