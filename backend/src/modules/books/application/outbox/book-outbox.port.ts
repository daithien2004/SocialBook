export type BookOutboxEvent =
  | {
      id: string;
      type: 'book.created' | 'book.updated';
      bookId: string;
      attempts?: number;
    }
  | { id: string; type: 'book.deleted'; bookId: string; attempts?: number };

export abstract class BookOutboxPort {
  abstract append(event: BookOutboxEvent): Promise<void>;
  abstract claimBatch(limit: number): Promise<BookOutboxEvent[]>;
  abstract markPublished(eventId: string): Promise<void>;
  abstract release(eventId: string, retryDelayMs: number): Promise<void>;
}
