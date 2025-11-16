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
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  paragraphs: Paragraph[];
}
