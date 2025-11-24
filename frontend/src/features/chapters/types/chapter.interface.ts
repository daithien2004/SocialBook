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
