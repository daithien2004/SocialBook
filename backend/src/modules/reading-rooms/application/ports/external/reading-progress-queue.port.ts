export interface ReadingProgressJob {
  userId: string;
  bookId: string;
  chapterId: string;
  progress: number;
}

export abstract class IReadingProgressQueuePort {
  abstract enqueue(progress: ReadingProgressJob): Promise<void>;
}
