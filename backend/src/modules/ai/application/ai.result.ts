export interface GenerateTextResult {
  response: string;
  requestId: string;
  responseLength: number;
}

export interface SummarizeChapterResult {
  summary: string;
  requestId: string;
  chapterId: string;
  summaryLength: number;
}
