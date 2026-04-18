export interface ImportChaptersChapterInput {
  title: string;
  content: string;
}

export interface ImportChaptersJobData {
  bookId: string;
  tempJsonPath: string;
}

export interface ImportChaptersJobProgress {
  total: number;
  processed: number;
  currentTitle?: string;
  successful: number;
  failed: number;
}

export interface ImportChaptersJobResult {
  total: number;
  successful: number;
  failed: number;
  failures: Array<{ title: string; reason: string }>;
}
