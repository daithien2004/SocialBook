export interface ScrapedChapterData {
  title: string;
  order: number;
  content: string;
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
