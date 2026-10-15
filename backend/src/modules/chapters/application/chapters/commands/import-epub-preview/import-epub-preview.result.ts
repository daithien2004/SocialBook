import type { ParsedChapter } from '@/modules/chapters/domain/chapters/interfaces/epub-parser.port';

export interface ImportEpubPreviewResult {
  chapters: ParsedChapter[];
  totalChapters: number;
}
