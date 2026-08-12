import {
  ImportChaptersChapterInput,
  ImportChaptersJobResult,
} from './chapters-import.types';

export interface StartChaptersImportParams {
  bookId: string;
  chapters: ImportChaptersChapterInput[];
}

export interface StartChaptersImportResult {
  jobId: string;
}

export interface ChaptersImportStatusResult {
  state:
    | 'completed'
    | 'failed'
    | 'active'
    | 'waiting'
    | 'delayed'
    | 'paused'
    | 'unknown';
  progress: unknown;
  result?: ImportChaptersJobResult;
  failedReason?: string;
}

export abstract class IChaptersImportService {
  abstract startImport(
    params: StartChaptersImportParams,
  ): Promise<StartChaptersImportResult>;
  abstract getStatus(jobId: string): Promise<ChaptersImportStatusResult>;
}
