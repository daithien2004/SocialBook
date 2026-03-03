export interface ScrapedChapterData {
  title: string;
  order: number;
  content: string; // HTML or text content
  paragraphs?: { content: string }[];
}

export interface ScrapedBookData {
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  genres: string[];
  status: string;
  sourceUrl: string;
  slug?: string;
  chapters?: ScrapedChapterData[];
}

export interface ScrapeResult {
  success: boolean;
  data?: ScrapedBookData;
  error?: string;
  message?: string;
}
