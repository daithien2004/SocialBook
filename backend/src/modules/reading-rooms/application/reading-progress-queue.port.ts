export const READING_PROGRESS_QUEUE = 'reading-progress';
export const READING_PROGRESS_DEBOUNCE_MS = 10_000;

export interface ReadingProgressJob {
  userId: string;
  bookId: string;
  chapterId: string;
  progress: number;
}

export abstract class ReadingProgressQueuePort {
  abstract enqueue(progress: ReadingProgressJob): Promise<void>;
}
